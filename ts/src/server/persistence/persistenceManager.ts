import type { JSONValue } from "../../common/object.ts";
import { ChunkMapComponentId } from "../../game/component/chunkMapComponent.ts";
import {
    ComponentID,
    type Components,
} from "../../game/component/component.ts";
import { PathfindingGraphComponentId } from "../../game/component/pathfindingGraphComponent.ts";
import { Entity } from "../../game/entity/entity.ts";
import type { PersistenceAdapter } from "./persistenceAdapter.ts";
import type { SerializedEntity } from "./serializedEntity.ts";
import type { SerializedWorldMeta } from "./serializedWorldMeta.ts";

type SerialisedComponent = JSONValue | null | undefined;

/**
 * Manages persistence of game state using a pluggable adapter.
 * Supports entity-level saves, subtree saves, and efficient batched operations.
 */
export class PersistenceManager {
    private adapter: PersistenceAdapter;

    constructor(adapter: PersistenceAdapter) {
        this.adapter = adapter;
    }

    /**
     * Check if a save exists
     */
    async hasSave(): Promise<boolean> {
        return this.adapter.hasSave();
    }

    /**
     * Save metadata about the world state
     */
    async saveMeta(meta: SerializedWorldMeta): Promise<void> {
        return this.adapter.saveMeta(meta);
    }

    /**
     * Load metadata about the world state
     */
    async loadMeta(): Promise<SerializedWorldMeta | null> {
        return this.adapter.loadMeta();
    }

    /**
     * Save an entity and all its descendants recursively.
     * Uses batched saving for performance.
     * @param rootEntity The entity to start the subtree save from
     */
    async saveSubtree(rootEntity: Entity): Promise<void> {
        const entitiesToSave: SerializedEntity[] = [];
        this.collectSubtree(rootEntity, entitiesToSave);

        await this.adapter.saveEntities(entitiesToSave);
    }

    /**
     * Save the entire world (all children of root).
     * Uses batched saving for performance.
     * @param root The root entity of the world
     */
    async saveWorld(root: Entity): Promise<void> {
        const entitiesToSave: SerializedEntity[] = [];

        for (const child of root.children) {
            this.collectSubtree(child, entitiesToSave);
        }

        await this.adapter.saveEntities(entitiesToSave);
    }

    /**
     * Load the entire world state and restore it to the ECS.
     * @param root The root entity to restore entities into
     * @returns True if a save was loaded, false if no save exists
     */
    async load(root: Entity): Promise<boolean> {
        const meta = await this.adapter.loadMeta();
        if (!meta) {
            return false;
        }

        const entities = await this.adapter.loadEntities();
        if (entities.length === 0) {
            return false;
        }

        // Build a map of entities by ID for quick lookup
        const entityMap = new Map<string, SerializedEntity>();
        for (const serializedEntity of entities) {
            entityMap.set(serializedEntity.id, serializedEntity);
        }

        // Build a map to track which entities have been created
        const createdEntities = new Map<string, Entity>();

        // First pass: create all entities and attach their components
        for (const serializedEntity of entities) {
            const entity = this.deserializeEntity(serializedEntity);
            createdEntities.set(entity.id, entity);
        }

        // Second pass: reconstruct the hierarchy
        for (const serializedEntity of entities) {
            const entity = createdEntities.get(serializedEntity.id);
            if (!entity) {
                continue;
            }

            if (serializedEntity.parentId) {
                // Find parent entity
                const parentEntity = createdEntities.get(
                    serializedEntity.parentId,
                );
                if (parentEntity) {
                    parentEntity.addChild(entity);
                } else {
                    // Parent not found in saved entities, attach to root
                    console.log(
                        `Parent ${serializedEntity.parentId} not found for entity ${entity.id}, attaching to root`,
                    );
                    root.addChild(entity);
                }
            } else {
                // No parent, attach to root
                root.addChild(entity);
            }
        }

        return true;
    }

    /**
     * Delete an entity from storage
     */
    deleteEntity(entityId: string): Promise<void> {
        return this.adapter.deleteEntity(entityId);
    }

    clearGame(): Promise<void> {
        return this.adapter.clearGame();
    }

    /**
     * Serialize an entity to a plain object suitable for storage
     */
    private serializeEntity(entity: Entity): SerializedEntity {
        // Deep clone components to avoid reference issues
        const componentsObj: Record<string, any> = {};
        for (const component of entity.components) {
            // Skip runtime-only components
            if (runtimeOnlyComponents.has(component.id)) {
                continue;
            }
            // Serialize component (handles Maps/Sets specially)
            componentsObj[component.id] = this.serializeComponent(component);
        }

        return {
            id: entity.id,
            parentId: entity.parent?.id ?? null,
            x: entity.worldPosition.x,
            y: entity.worldPosition.y,
            components: componentsObj,
        };
    }

    /**
     * Serialize component data, converting Maps and Sets to plain objects/arrays recursively
     */
    private serializeComponent(component: Components): SerialisedComponent {
        return this.serializeValue(component);
    }

    /**
     * Recursively serialize a value, handling Maps, Sets, and nested structures
     */
    private serializeValue(value: unknown): SerialisedComponent {
        if (value === null || value === undefined) {
            return value;
        }

        if (value instanceof Map) {
            // Convert Map to special object with type marker
            const obj: any = { __type: "Map", __data: {} };
            for (const [key, val] of value) {
                obj.__data[String(key)] = this.serializeValue(val);
            }
            return obj;
        }

        if (value instanceof Set) {
            // Convert Set to special object with type marker
            return {
                __type: "Set",
                __data: Array.from(value)
                    .map((v) => this.serializeValue(v))
                    .filter((i) => i !== undefined),
            };
        }

        if (Array.isArray(value)) {
            return value
                .map((v) => this.serializeValue(v))
                .filter((i) => i !== undefined);
        }

        if (typeof value === "object") {
            const result: any = {};
            for (const [key, val] of Object.entries(value)) {
                result[key] = this.serializeValue(val);
            }
            return result;
        }

        if (
            typeof value === "number" ||
            typeof value === "boolean" ||
            typeof value === "string"
        ) {
            // Primitives
            return value;
        }

        throw new Error("Unable to serialise value");
    }

    /**
     * Deserialize a stored entity back into an Entity instance
     */
    private deserializeEntity(serialized: SerializedEntity): Entity {
        const entity = new Entity(serialized.id);

        // Restore components
        for (const componentId in serialized.components) {
            const component = serialized.components[componentId];
            const deserializedComponent = this.deserializeComponent(component);
            entity.setEcsComponent(deserializedComponent);
        }

        // Set position (will be in local space once parented)
        entity.worldPosition = { x: serialized.x, y: serialized.y };

        return entity;
    }

    /**
     * Deserialize component data, reconstructing Maps and Sets that were serialized as objects/arrays
     */
    private deserializeComponent(component: any): any {
        return this.deserializeValue(component);
    }

    /**
     * Recursively deserialize a value, reconstructing Maps and Sets from type markers
     */
    private deserializeValue(value: any): any {
        if (value === null || value === undefined) {
            return value;
        }

        // Check for type markers
        if (typeof value === "object" && value.__type) {
            if (value.__type === "Map") {
                const map = new Map();
                for (const [key, val] of Object.entries(value.__data)) {
                    // Try to convert numeric keys back to numbers
                    const actualKey = isNaN(Number(key)) ? key : Number(key);
                    map.set(actualKey, this.deserializeValue(val));
                }
                return map;
            }

            if (value.__type === "Set") {
                return new Set(
                    value.__data.map((v: any) => this.deserializeValue(v)),
                );
            }
        }

        if (Array.isArray(value)) {
            return value.map((v) => this.deserializeValue(v));
        }

        if (typeof value === "object") {
            const result: any = {};
            for (const [key, val] of Object.entries(value)) {
                result[key] = this.deserializeValue(val);
            }
            return result;
        }

        // Primitives
        return value;
    }

    /**
     * Recursively collect an entity and all its descendants
     */
    private collectSubtree(
        entity: Entity,
        collection: SerializedEntity[],
    ): void {
        collection.push(this.serializeEntity(entity));

        for (const child of entity.children) {
            this.collectSubtree(child, collection);
        }
    }
}

// Runtime-only components that should not be persisted
const runtimeOnlyComponents = new Set<ComponentID>([
    ChunkMapComponentId,
    PathfindingGraphComponentId,
]);
