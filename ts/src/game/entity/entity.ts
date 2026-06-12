import { removeItem } from "../../common/array.ts";
import { InvalidArgumentError } from "../../common/error/invalidArgumentError.ts";
import {
    type Point,
    addPoint,
    pointEquals,
    subtractPoint,
    zeroPoint,
} from "../../common/point.ts";
import { GameTime } from "../../common/time.ts";
import type {
    BaseComponent,
    ComponentID,
    Components,
} from "../component/component.ts";
import { visitChildren } from "./child/visit.ts";
import { entityWithId } from "./child/withId.ts";
import type { EntityEvent } from "./entityEvent.ts";
import { log } from "../../common/logging/logger.ts";

/**
 * Represents a node in the entity tree used to create a scenegraph for the
 * game. Entities has positions and components attached to them.
 *
 * For more info see the entities.md doc
 */
export class Entity {
    private _isGameRoot = false;
    private _parent?: Entity;
    private _tags: Set<string> | undefined;
    private _children: Entity[] = [];
    private _localPosition: Point = zeroPoint();
    private _worldPosition: Point = zeroPoint();
    private _entityEvents?: (event: EntityEvent) => void;
    private _ecsComponents = new Map<string, Components>();
    /**
     * Lazily-built cache of `queryComponents` results for this entity's subtree,
     * keyed by component id. A miss runs the `visitChildren` walk once and stores
     * the resulting map; subsequent identical queries return the same map without
     * re-walking. Invalidated by {@link invalidateQueryCache} on the entity events
     * this entity receives (only membership changes matter — see that method).
     *
     * Runtime-only: it is rebuilt from the live tree and is never serialized
     * (persistence walks `_ecsComponents` and children, not this field). Only
     * entities actually queried (in practice the root) ever allocate one.
     */
    private _queryCache?: Map<ComponentID, Map<Entity, Components>>;
    private _gameTime?: GameTime;
    readonly id: EntityId;

    constructor(id: EntityId) {
        this.id = id;
    }

    /**
     * Returns the parent entity of this entity, can be null if this is the root
     * entity or if the entity is not attached to the entity tree
     */
    get parent(): Entity | undefined {
        return this._parent;
    }
    /**
     * Set the parent for this entity
     */
    set parent(entity: Entity | undefined) {
        this._parent = entity;
    }

    /**
     * Return if this entity is the game root of the entity tree. This is
     * handled explicitly with a variable rather than checking if the
     * entity has any parents as it is used to check if any children or
     * itself is attached to the game tree or if it is a detached or
     * independent tree that has not been added yet.
     */
    get isGameRoot(): boolean {
        return this._isGameRoot;
    }

    /**
     * Returns the position of this entity locally in its own space
     */
    get position(): Point {
        return this._localPosition;
    }

    /**
     * Set the position of this entity locally in its own space
     */
    set position(position: Point) {
        if (!pointEquals(this._localPosition, position)) {
            const oldPosition = this._worldPosition;
            this._localPosition = position;
            this.updateTransform();
            this.bubbleEvent({
                id: "transform",
                source: this,
                oldPosition,
            });
        }
    }

    /**
     * Return the postion of this entity express as its world position
     */
    get worldPosition(): Point {
        return this._worldPosition;
    }

    /**
     * Set the position of this entity in world space
     * Will update its local position to be offset the parent to achieve
     * the wanted world position
     */
    set worldPosition(position: Point) {
        if (!pointEquals(this._worldPosition, position)) {
            const oldPosition = this._worldPosition;
            this._worldPosition = position;
            if (this.parent) {
                this._localPosition = subtractPoint(
                    position,
                    this.parent.worldPosition,
                );
            } else {
                this._localPosition = position;
            }
            this.updateTransform();
            // Bubble up position change
            this.bubbleEvent({
                id: "transform",
                source: this,
                oldPosition,
            });
        }
    }

    /**
     * Returns a readonly list of the child entities of this entity.
     * To add or remove children use the `addChild` or `removeChild` methods
     */
    get children(): readonly Entity[] {
        return this._children;
    }

    get gameTime(): GameTime {
        if (!!this._gameTime) {
            return this._gameTime;
        } else {
            throw new Error(
                "No gametime set, this entity is perhaps not added to a root entity?",
            );
        }
    }

    set gameTime(v: GameTime | undefined) {
        this._gameTime = v;
    }

    get entityEvent(): ((event: EntityEvent) => void) | undefined {
        return this._entityEvents;
    }

    set entityEvent(value: ((event: EntityEvent) => void) | undefined) {
        this._entityEvents = value;
    }

    get components(): ReadonlyArray<Readonly<Components>> {
        return Array.from(this._ecsComponents.values());
    }

    get tags(): ReadonlySet<string> {
        return this._tags ?? emptySet;
    }
    /**
     * Set if this entity is the root of the entity tree
     */
    toggleIsGameRoot(value: boolean) {
        if (value == this._isGameRoot) {
            return;
        }

        if (!!this._parent && value) {
            throw new InvalidArgumentError(
                "Cannot set entity to game root if it has a parent",
            );
        }

        this._isGameRoot = value;
    }

    addTag(tag: string) {
        if (!this._tags) {
            this._tags = new Set();
        }

        this._tags.add(tag);
    }

    removeTag(tag: string) {
        if (!this._tags) {
            return;
        }

        this._tags.delete(tag);
    }

    clearTags() {
        this._tags?.clear();
    }

    /**
     * Add a entity to this entity
     * @param entity the entity to add
     */
    addChild(entity: Entity, index: number | null = null) {
        if (entity === this) {
            throw new InvalidArgumentError("Cannot add self as a child");
        }

        if (entity.parent) {
            throw new InvalidArgumentError(
                "Entity is already added to another entity",
            );
        }

        if (index != null) {
            this._children.splice(index, 0, entity);
        } else {
            this._children.push(entity);
        }
        entity.parent = this;
        entity.gameTime = this._gameTime;
        // Keep the child's world position unchanged across the parenting:
        // recompute its local position relative to this entity and update
        // the transforms of its subtree so locals and worlds stay
        // consistent. No transform event is bubbled — the world position
        // did not change, and the child_added event below covers spatial
        // indexing.
        entity._localPosition = subtractPoint(
            entity.worldPosition,
            this.worldPosition,
        );
        entity.updateTransform();

        // Bubble change
        this.bubbleEvent({
            id: "child_added",
            source: this,
            target: entity,
        });
    }

    /**
     * Removes the entity from the list of children
     * @param entity the entity to remove
     * @returns if the entity was removed successfully
     */
    removeChild(entity: Entity): boolean {
        if (!entity.parent) {
            throw new InvalidArgumentError("Child does not have a parent");
        }

        // Bubble change
        this.bubbleEvent({
            id: "child_removed",
            source: this,
            target: entity,
        });

        return removeItem(this._children, entity);
    }

    /**
     * Remove the entity from the child list of the parent if any
     */
    remove(): void {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    /**
     * Walks up the node tree to find the root entity
     * if no parent is defined for this entity, this entity is returned
     * @returns the entity at the end of the parent chain
     */
    getRootEntity(): Entity {
        let root: Entity | undefined = this;
        while (root?._parent) {
            root = root.parent;
        }

        //If parent is not truthy the while will not run an root will be this
        //so it should be safe to return root as non nullable
        return root!;
    }

    findEntity(id: string): Entity | null {
        //TODO: cache the result here to dont walk the tree on every call
        //use entity events to invalidate cache on remove
        return entityWithId(this, id);
    }

    /**
     * Check if this entity is attached to a live entity tree
     */
    isAttached(): boolean {
        if (this._parent) {
            return this._parent.isAttached();
        } else {
            return this._isGameRoot;
        }
    }

    setEcsComponent(ecsComponent: Components & BaseComponent) {
        this._ecsComponents.set(ecsComponent.id, ecsComponent);
        // component_added carries upsert semantics for the query cache: it is
        // emitted on both a first add and a replace, and the cache does
        // `map.set(source, item)` either way, which correctly overwrites a stale
        // reference on replace. `updateComponent` never reaches here (it mutates
        // in place), so it never changes a component's reference.
        this.bubbleEvent({
            id: "component_added",
            source: this,
            item: ecsComponent,
        });
    }

    removeEcsComponent(componentId: ComponentID) {
        const removed = this._ecsComponents.get(componentId);
        if (!removed) {
            return;
        }
        this._ecsComponents.delete(componentId);
        this.bubbleEvent({
            id: "component_removed",
            source: this,
            item: removed,
        });
    }

    getEcsComponent<ID extends ComponentID>(
        componentId: ID,
    ): Extract<Components, { id: ID }> | null {
        const component = this._ecsComponents.get(componentId);
        if (!component) {
            return null;
        }

        return component as Extract<Components, { id: ID }>;
    }

    requireEcsComponent<ID extends ComponentID>(
        componentId: ID,
    ): Extract<Components, { id: ID }> {
        const component = this.getEcsComponent(componentId);
        if (!component) {
            throw new Error(`No component of type ${componentId}`);
        }

        return component;
    }

    getAncestorEcsComponent<ID extends ComponentID>(
        componentId: ID,
    ): Extract<Components, { id: ID }> | null {
        let current: Entity | undefined = this;
        while (current) {
            const component = current.getEcsComponent(componentId);
            if (component) {
                return component;
            }
            current = current.parent;
        }
        return null;
    }

    requireAncestorEcsComponent<ID extends ComponentID>(
        componentId: ID,
    ): Extract<Components, { id: ID }> {
        const component = this.getAncestorEcsComponent(componentId);
        if (!component) {
            throw new Error(`No ancestor component of type ${componentId}`);
        }

        return component;
    }

    getAncestorEntity<ID extends ComponentID>(componentId: ID): Entity | null {
        let current: Entity | undefined = this;
        while (current) {
            const component = current.getEcsComponent(componentId);
            if (component) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }

    requireAncestorEntity<ID extends ComponentID>(componentId: ID): Entity {
        const entity = this.getAncestorEntity(componentId);
        if (!entity) {
            throw new Error(`No ancestor component of type ${componentId}`);
        }

        return entity;
    }

    hasComponent<ID extends ComponentID>(componentId: ID): boolean {
        return this._ecsComponents.has(componentId);
    }

    queryComponents<ID extends ComponentID>(
        componentId: ID,
    ): ReadonlyMap<Entity, Extract<Components, { id: ID }>> {
        let cached = this._queryCache?.get(componentId);
        if (!cached) {
            cached = new Map<Entity, Components>();
            visitChildren(this, (child) => {
                const matchingComponent = child.getEcsComponent(componentId);
                if (matchingComponent) {
                    cached!.set(child, matchingComponent);
                }
                return false;
            });
            (this._queryCache ??= new Map()).set(componentId, cached);
        }

        // All entries under a given id key carry that component type; the cache
        // stores the erased `Components` union and we narrow on the way out, the
        // same cast the uncached walk used to do per entry.
        return cached as unknown as ReadonlyMap<
            Entity,
            Extract<Components, { id: ID }>
        >;
    }

    /**
     * Invalidate a component signaling that it has changed
     * Will emit an entity event that can be listened to
     * @param componentId the component that changed
     * @param oldValue optional previous value for delta computation
     */
    invalidateComponent(componentId: ComponentID, oldValue?: Components) {
        const component = this.getEcsComponent(componentId);
        if (!!component) {
            this.bubbleEvent({
                id: "component_updated",
                item: component,
                source: this,
                oldValue,
            });
        }
    }

    updateComponent<ID extends ComponentID>(
        componentId: ID,
        updater: (component: Extract<Components, { id: ID }>) => void,
    ) {
        const component = this.getEcsComponent(componentId);
        if (component) {
            // Capture snapshot before mutation for delta computation
            const snapshot = structuredClone(component);
            updater(component);
            this.invalidateComponent(componentId, snapshot);
        }
    }
    /**
     * Update the world position of this entity based on a parent position.
     * The world position is calculated based on the parent position and this
     * entity's local position
     */
    private updateTransform() {
        let newPosition = this._localPosition;
        if (this.parent) {
            // If there is a parent, add its world position to the
            // local position, to get this entitys new world position
            newPosition = addPoint(
                this.parent.worldPosition,
                this._localPosition,
            );
        }

        this._worldPosition = newPosition;
        // Update children
        for (let i = 0; i < this._children.length; i++) {
            this._children[i].updateTransform();
        }
    }

    bubbleEvent(event: EntityEvent) {
        this.invalidateQueryCache(event);
        if (!!this._entityEvents) {
            try {
                this._entityEvents(event);
            } catch (e) {
                log.error("Failed to bubble event", {
                    eventId: event.id,
                    error: e,
                    event,
                });
            }
        }
        this._parent?.bubbleEvent(event);
    }

    /**
     * Keeps this entity's {@link _queryCache} consistent as events bubble past
     * it. `bubbleEvent` runs on the source entity and then every ancestor, so an
     * ancestor whose subtree changed deep below invalidates its own cache here.
     *
     * Only membership changes matter:
     *  - `component_added` / `component_removed` upsert / delete the one
     *    (entity → component) entry, leaving every other cached query intact.
     *  - `child_added` / `child_removed` can change many component ids at once,
     *    so the whole cache is dropped and rebuilt lazily.
     *
     * `component_updated` and `transform` are deliberately ignored:
     * `updateComponent` mutates the component in place (same reference, same
     * membership) so the cached map is still correct, and these two are the
     * per-tick hot events — reacting to them would thrash the cache every frame
     * for no benefit.
     */
    private invalidateQueryCache(event: EntityEvent) {
        const cache = this._queryCache;
        if (!cache) {
            return;
        }
        switch (event.id) {
            case "component_added":
                cache.get(event.item.id)?.set(event.source, event.item);
                break;
            case "component_removed":
                cache.get(event.item.id)?.delete(event.source);
                break;
            case "child_added":
            case "child_removed":
                cache.clear();
                break;
            default:
                break;
        }
    }
}

export function assertEntity(
    entity: Entity | string | null,
): asserts entity is Entity {
    if (!entity) {
        throw new Error("Entity is not defined");
    }
    if (typeof entity == "string") {
        throw new Error("Entity has not been resolved from id");
    }
}

const emptySet = new Set<string>();

export const RootEntityId = "root";
/**
 * Makes it more readable that we are referring to a an Entity ID
 */
export type EntityId = string;
/*
type Data = { foo: string };

function assertData(d: Data | null): asserts d is Data {
    if (d == null) throw new Error("Invalid data");
}
// Use
declare var bar: Data | null;
bar.foo; // error as expected
assertData(bar);
bar.foo; // inferred to be Data*/
