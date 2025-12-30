import { encodePosition } from "../../common/point.ts";
import { SparseSet } from "../../common/structure/sparseSet.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { ChunkSize } from "../map/chunk.ts";
import {
    ChunkMapRegistryComponentId,
    createChunkMapRegistryComponent,
    getChunkMap,
    type ChunkMap,
    createChunkMap,
} from "../component/chunkMapRegistryComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type {
    EntityChildrenUpdatedEvent,
    EntityTransformEvent,
} from "../entity/entityEvent.ts";
import { getOverworldEntity } from "../map/scenes.ts";
import { SpaceComponentId } from "../component/spaceComponent.ts";
import { visitChildren } from "../entity/child/visit.ts";

export const chunkMapSystem: EcsSystem = {
    onInit: init,
    onEntityEvent: {
        child_added: onEntityAdded,
        child_removed: onEntityRemoved,
        transform: onTransform,
    },
};

/**
 * Run init actions
 * Chunk maps are populated on-demand via event handlers.
 * @param root the root entity of the system
 */
function init(_root: Entity) {
    // Registry already exists from root factory, nothing to do
}

/**
 * Update the position of an entity in the chunkmap on each transform event
 * @param rootEntity the root entity of the system
 * @param entityEvent the event that occured
 */
function onTransform(_rootEntity: Entity, entityEvent: EntityTransformEvent) {
    const registry = entityEvent.source.requireAncestorEcsComponent(
        ChunkMapRegistryComponentId,
    );
    const spaceEntity = entityEvent.source.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        //TODO: should probaby use a collider component or something instead
        if (entityEvent.source.hasComponent(SpaceComponentId)) {
            console.warn(
                `[ChunkMapSystem] Entity ${entityEvent.source.id} has no space ancestor, cannot update chunk map`,
            );
        }
        return;
    }

    const chunkMap = getOrCreateChunkMap(registry, spaceEntity);

    const currentChunkId = chunkMap.entityChunkMap.get(entityEvent.source.id);
    if (currentChunkId === undefined) {
        addToChunkmap(chunkMap, entityEvent.source);
        return;
    }

    const chunkX = Math.floor(entityEvent.source.worldPosition.x / ChunkSize);
    const chunkY = Math.floor(entityEvent.source.worldPosition.y / ChunkSize);
    const newChunkKey = encodePosition(chunkX, chunkY);
    if (currentChunkId === newChunkKey) {
        return;
    }
    const currentChunk = getOrCreateChunk(chunkMap, currentChunkId);
    currentChunk.delete(entityEvent.source);

    chunkMap.entityChunkMap.set(entityEvent.source.id, newChunkKey);
    const newChunk = getOrCreateChunk(chunkMap, newChunkKey);
    newChunk.add(entityEvent.source);
}

/**
 * Add an entity to the chunkmap if it is added to the scene
 * @param rootEntity the root of the system
 * @param scopedEntity the entity that is the current scope of the ecs
 * @param entityEvent the event that happened
 */
function onEntityAdded(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const registry = entityEvent.target.requireAncestorEcsComponent(
        ChunkMapRegistryComponentId,
    );
    const spaceEntity = entityEvent.target.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        if (entityEvent.target.hasComponent(SpaceComponentId)) {
            console.warn(
                `[ChunkMapSystem] Entity ${entityEvent.target.id} has no space ancestor, cannot add to chunk map`,
            );
        }

        return;
    }

    const chunkMap = getOrCreateChunkMap(registry, spaceEntity);
    addToChunkmap(chunkMap, entityEvent.target);
}

function addToChunkmap(chunkMap: ChunkMap, entity: Entity) {
    // Convert to chunk coordinates
    const chunkX = Math.floor(entity.worldPosition.x / ChunkSize);
    const chunkY = Math.floor(entity.worldPosition.y / ChunkSize);
    const chunkKey = encodePosition(chunkX, chunkY);
    const chunk = getOrCreateChunk(chunkMap, chunkKey);
    chunkMap.entityChunkMap.set(entity.id, chunkKey);
    chunk.add(entity);
}

/**
 * Remove an entity from the chunkmap when removed from the scene
 * @param rootEntity the root of the system
 * @param entityEvent the event that happened
 */
function onEntityRemoved(
    _rootEntity: Entity,
    entityEvent: EntityChildrenUpdatedEvent,
) {
    const registry = entityEvent.target.requireAncestorEcsComponent(
        ChunkMapRegistryComponentId,
    );
    const spaceEntity = entityEvent.target.getAncestorEntity(SpaceComponentId);
    if (!spaceEntity) {
        if (entityEvent.target.hasComponent(SpaceComponentId)) {
            console.warn(
                `[ChunkMapSystem] Entity ${entityEvent.target.id} has no space ancestor, cannot remove from chunk map`,
            );
        }
        return;
    }

    const chunkMap = getChunkMap(registry, spaceEntity.id);
    if (!chunkMap) {
        console.debug(
            `[ChunkMapSystem] No chunk map found for space ${spaceEntity.id}, cannot remove entity`,
        );
        return;
    }

    const chunkForEntity = chunkMap.entityChunkMap.get(entityEvent.target.id);
    if (chunkForEntity === undefined) {
        return;
    }

    const chunk = chunkMap.chunks.get(chunkForEntity);
    if (chunk === undefined) {
        return;
    }

    chunk.delete(entityEvent.target);
    chunkMap.entityChunkMap.delete(entityEvent.target.id);
}

/**
 * Gets or creates a chunk map for a space entity
 * @param registry The chunk map registry
 * @param spaceEntity The space entity to get/create a chunk map for
 * @returns The chunk map for the space
 */
function getOrCreateChunkMap(
    registry: ReturnType<typeof createChunkMapRegistryComponent>,
    spaceEntity: Entity,
): ChunkMap {
    let chunkMap = getChunkMap(registry, spaceEntity.id);
    if (!chunkMap) {
        // Create chunk map if it doesn't exist
        console.log(
            `[ChunkMapSystem] Creating new chunk map for space ${spaceEntity.id}`,
        );
        chunkMap = createChunkMap();
        registry.chunkMaps.set(spaceEntity.id, chunkMap);
    }
    return chunkMap;
}

function getOrCreateChunk(
    chunkMap: ChunkMap,
    chunkKey: number,
): SparseSet<Entity> {
    const chunk = chunkMap.chunks.get(chunkKey);
    if (!!chunk) {
        return chunk;
    } else {
        const set = new SparseSet<Entity>();
        chunkMap.chunks.set(chunkKey, set);
        return set;
    }
}
