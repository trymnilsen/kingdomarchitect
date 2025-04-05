import { removeItem } from "../../common/array.js";
import {
    ConstructorFunction,
    getConstructorName,
} from "../../common/constructor.js";
import { InvalidArgumentError } from "../../common/error/invalidArgumentError.js";
import { RequireError } from "../../common/error/requireError.js";
import { Event, EventListener } from "../../common/event.js";
import { TypedEvent } from "../../common/event/typedEvent.js";
import {
    addPoint,
    Point,
    pointEquals,
    subtractPoint,
    zeroPoint,
} from "../../common/point.js";
import { ReadableSet, SparseSet } from "../../common/structure/sparseSet.js";
import { GameTime } from "../../common/time.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../rendering/renderVisibilityMap.js";
import type { ComponentType } from "../component/component.js";
import { TileSize } from "../../module/map/tile.js";
import { selectFromChild } from "./child/select.js";
import { visitChildren } from "./child/visit.js";
import { entityWithId } from "./child/withId.js";
import { EntityEvent } from "./entityEvent.js";

/**
 * Represents a node in the entity tree used to create a scenegraph for the
 * game. Entities has positions and components attached to them.
 *
 * For more info see the entities.md doc
 */
export class Entity {
    private _isGameRoot = false;
    private _parent?: Entity;
    private _children: Entity[] = [];
    private _localPosition: Point = zeroPoint();
    private _worldPosition: Point = zeroPoint();

    private _ecsComponents = new Map<string, ComponentType>();
    private _gameTime?: GameTime;

    constructor(readonly id: EntityId) {}

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
            this._localPosition = position;
            this.updateTransform();
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
        }
    }

    /**
     * Returns a readonly list of the child entities of this entity.
     * To add or remove children use the `addChild` or `removeChild` methods
     */
    get children(): readonly Entity[] {
        return this._children;
    }

    public get gameTime(): GameTime {
        if (!!this._gameTime) {
            return this._gameTime;
        } else {
            throw new Error(
                "No gametime set, this entity is perhaps not added to a root entity?",
            );
        }
    }

    public set gameTime(v: GameTime | undefined) {
        this._gameTime = v;
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
        //Update the world position of the entity
        entity.parent = this;
        entity.gameTime = this._gameTime;
        // Update the transform of the entity (also bubbles a transform
        // change adding the entity ot the chunk map if its not present)
        // We want the world position to be the same, so we need to calculate
        // a new local position. Setting the local position also trigges and
        // update transform
        const newLocal = subtractPoint(
            entity.worldPosition,
            this.worldPosition,
        );
        this._localPosition = newLocal;
        //entity.updateTransform();

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

    addEcsComponent(ecsComponent: ComponentType) {
        const componentName = getConstructorName(ecsComponent);
        this._ecsComponents.set(componentName, ecsComponent);
    }

    getEcsComponent<TFilter extends ComponentType>(
        filterType: ConstructorFunction<TFilter>,
    ): TFilter | null {
        const componentId = filterType.name;
        const component = this._ecsComponents.get(componentId) as TFilter;
        return component || null;
    }

    queryComponents<T extends ConstructorFunction<ComponentType>>(
        component: T,
    ): Map<Entity, InstanceType<T>> {
        //How do we avoid three (or two when old is removed) caches
        const map = new Map<Entity, InstanceType<T>>();

        visitChildren(this, (child) => {
            const matchingComponent = child.getEcsComponent(component);
            if (matchingComponent) {
                map.set(child, matchingComponent as InstanceType<T>);
            }
            return false;
        });

        return map;
    }

    /**
     * Update the world position of this entity based on a parent position.
     * The world position is calculated based on the parent position and this
     * entity's local position
     */
    updateTransform() {
        if (this.parent) {
            // If there is a parent, add its world position to the
            // local position, to get this entitys new world position
            this._worldPosition = addPoint(
                this.parent.worldPosition,
                this._localPosition,
            );
        } else {
            // If there is no parent update the world position to this
            this._worldPosition = this._localPosition;
        }
        // Bubble up position change
        this.bubbleEvent({
            id: "transform",
            source: this,
        });
        // Update children
        for (let i = 0; i < this._children.length; i++) {
            this._children[i].updateTransform();
        }
    }

    bubbleEvent(event: EntityEvent) {
        /*
        try {
            if (!!this._componentsQueryCache2) {
                switch (event.id) {
                    case "child_added":
                        this._componentsQueryCache2.addEntity(event.target);
                        break;
                    case "child_removed":
                        this._componentsQueryCache2.removeEntity(event.target);
                        break;
                    case "component_added":
                        this._componentsQueryCache2.addComponent(event.item);
                        break;
                    case "component_removed":
                        this._componentsQueryCache2.removeComponent(event.item);
                        break;
                    default:
                        break;
                }
            }

            if (!!this._componentsQueryCache) {
                if (event.id == "child_added" || event.id == "child_removed") {
                    this._componentsQueryCache.clearAll();
                } else if (
                    event.id == "component_added" ||
                    event.id == "component_removed"
                ) {
                    const constructorFn = Object.getPrototypeOf(event.item);
                    this._componentsQueryCache.clearEntry(constructorFn);
                }
            }

            this._entityEvents.publish(event);
            this._parent?.bubbleEvent(event);
        } catch (e) {
            console.error(`Failed to bubble event: ${event.id}`, e, event);
        }*/
        this._parent?.bubbleEvent(event);
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
