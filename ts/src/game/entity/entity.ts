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
import { ComponentEvent } from "../componentOld/componentEvent.js";
import { ComponentQueryCache } from "../componentOld/componentQueryCache.js";
import {
    ComponentsQueryCache2 as ComponentQueryCache2,
    QueryData,
    QueryObject,
    ComponentMap,
} from "../componentOld/componentQueryCache2.js";
import { EntityComponent } from "../componentOld/entityComponent.js";
import { TilesComponent } from "../componentOld/tile/tilesComponent.js";
import { TileSize } from "../map/tile.js";
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
    private _componentEvents = new TypedEvent<
        ComponentEvent<EntityComponent>
    >();
    private _entityEvents = new Event<EntityEvent>();
    private _componentsMap = new Map<string, EntityComponent>();
    private _ecsComponents = new Map<string, ComponentType>();
    private _componentsQueryCache?: ComponentQueryCache;
    private _componentsQueryCache2?: ComponentQueryCache2;
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

    get entityEvents(): EventListener<EntityEvent> {
        return this._entityEvents;
    }

    get componentEvents(): TypedEvent<ComponentEvent<EntityComponent>> {
        return this._componentEvents;
    }

    get components(): EntityComponent[] {
        return Array.from(this._componentsMap.values());
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
        if (value) {
            //TODO: If lifecycle is removed from components this can be removed
            visitChildren(this, (entity) => {
                for (const component of entity.components) {
                    component.onStart(0);
                }
                return false;
            });
        }
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
        //Get components if any that needs to be started if the entity is attached
        if (this.isAttached()) {
            for (const component of entity.components) {
                component.onStart(0);
            }
        }
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

        // Stop any components on the entity being removed
        for (const component of entity.components) {
            component.onStop(0);
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

    /**
     * Add a component to the entity
     * @param entityComponent
     */
    addComponent(entityComponent: EntityComponent) {
        const componentName = getConstructorName(entityComponent);

        if (this._componentsMap.get(componentName)) {
            throw new InvalidArgumentError(
                `Component already added ${componentName}`,
            );
        }
        entityComponent.entity = this;
        // call any lifecycle methods on the component if we are attached
        if (this.isAttached()) {
            entityComponent.onStart(0);
        }

        this._componentsMap.set(componentName, entityComponent);

        this.bubbleEvent({
            id: "component_added",
            source: this,
            item: entityComponent,
        });
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

    /**
     * Removes a component from the entity
     * @param entityComponent the component to remove
     * @returns true if the removal was successful
     */
    removeComponent(entityComponent: EntityComponent): boolean {
        const componentName = getConstructorName(entityComponent);
        if (this._componentsMap.get(componentName)) {
            this._componentsMap.delete(componentName);
            if (this._parent) {
                entityComponent.onStop(0);
            }

            this.bubbleEvent({
                id: "component_removed",
                source: this,
                item: entityComponent,
            });

            return true;
        } else {
            return false;
        }
    }

    /**
     * Retrieves a component from this entity based on its type
     *
     * Example:
     * ````
     * // note how the constructor is used as the argument
     * const component = entity.getComponent(SpriteComponent);
     * ````
     *
     * @param filterType the type of the component to get
     * @returns the component if it exists or null if it is not present on the entity
     */
    getComponent<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ): TFilter | null {
        const componentId = filterType.name;
        const component = this._componentsMap.get(componentId) as TFilter;
        return component || null;
    }

    /**
     * Retrieves a component from this entity based on its type
     *
     * Example:
     * ````
     * // note how the constructor is used as the argument
     * const component = entity.getComponent(SpriteComponent);
     * ````
     *
     * @throws RequireError if the component is not present
     * @param filterType the type of the component to get
     * @returns the component on the entity of this type
     */
    requireComponent<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ): TFilter {
        const component = this.getComponent(filterType);
        if (component) {
            return component;
        } else {
            throw new RequireError(
                `Required component ${filterType.name} was not present`,
            );
        }
    }

    /**
     * Get the first match for component either on this entity or any parents
     *
     * @see getComponent
     * @param filterType the type of the component to get
     */
    getAncestorComponent<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ): TFilter | null {
        let entityToLookOn: Entity | undefined = this;

        while (entityToLookOn) {
            const component = entityToLookOn.getComponent(filterType);
            if (component) {
                return component;
            }
            // Set the entity to look on to the parent and try again
            entityToLookOn = entityToLookOn.parent;
        }

        return null;
    }

    /**
     * Lookup all components of the given type on this entity and
     * all of the nested children
     * @param filterType the of components to query for
     */
    queryComponentsOld<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ): TFilter[] {
        if (!this._componentsQueryCache) {
            this._componentsQueryCache = new ComponentQueryCache();
        }

        const cachedList = this._componentsQueryCache.getComponents(filterType);
        if (!!cachedList) {
            return cachedList;
        }

        //No cached entries found, iterate over all the nested children for
        //the given component type
        const childComponents = selectFromChild(this, (child) => {
            return child.getComponent(filterType);
        });

        this._componentsQueryCache.setComponents(filterType, childComponents);

        return childComponents;
    }

    queryEcsComponents<T extends ConstructorFunction<ComponentType>>(
        component: T,
    ): Map<EntityId, InstanceType<T>> {
        //How do we avoid three (or two when old is removed) caches
        const map = new Map<EntityId, InstanceType<T>>();

        visitChildren(this, (child) => {
            const matchingComponent = child.getEcsComponent(component);
            if (matchingComponent) {
                map.set(child.id, matchingComponent as InstanceType<T>);
            }
            return false;
        });

        return map;
    }

    queryComponents<T extends ConstructorFunction<EntityComponent>>(
        component: T,
    ): ReadableSet<InstanceType<T>, EntityId> {
        //How do we avoid three (or two when old is removed) caches
        const set = new SparseSet<InstanceType<T>, EntityId>(
            (item) => item.entity.id,
        );

        visitChildren(this, (child) => {
            const matchingComponent = child.getComponent(component);
            if (matchingComponent) {
                set.add(matchingComponent as InstanceType<T>);
            }
            return false;
        });

        return set;
    }

    queryMultipleComponents<T extends QueryObject>(
        queryObject: T,
    ): Iterable<QueryData<T>> {
        let cache = this._componentsQueryCache2;
        if (!cache) {
            cache = new ComponentQueryCache2(this.getRootEntity());
            this._componentsQueryCache2 = cache;
        }

        return cache.query(queryObject);
    }

    /**
     * Request the entity runs its onDraw for components and children.
     * Note: this method has a varying frequency of updates. Any logic that
     * needs a consistent update cycle should be called in onUpdate
     * @param renderContext the context used to render anything to the canvas
     */
    onDraw(
        renderContext: RenderScope,
        visibilityMap: RenderVisibilityMap,
        mode: DrawMode,
        propegate: boolean = true,
    ) {
        if (this._componentsMap.size > 0) {
            const isVisible = visibilityMap.isVisible(
                this.worldPosition.x,
                this.worldPosition.y,
            );

            if (!visibilityMap.useVisibility || isVisible || this._isGameRoot) {
                //Calculating the screen position once for components
                const screenPosition =
                    renderContext.camera.tileSpaceToScreenSpace(
                        this._worldPosition,
                    );

                const withinTheViewport =
                    screenPosition.x + 40 > 0 &&
                    screenPosition.y + 40 > 0 &&
                    screenPosition.x - 40 < renderContext.width &&
                    screenPosition.y - 40 < renderContext.height;

                for (const component of this._componentsMap.values()) {
                    component.onDraw(
                        renderContext,
                        screenPosition,
                        visibilityMap,
                        mode,
                    );
                }
            }
            /*
            const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
                this._worldPosition,
            );

            if (withinTheViewport || this._isGameRoot) {
                for (const component of this._componentsMap) {
                    component[1].onDraw(
                        renderContext,
                        screenPosition,
                        visibilityMap,
                        mode,
                    );
                }
            }*/
        }
        if (propegate) {
            for (let i = 0; i < this._children.length; i++) {
                this._children[i].onDraw(renderContext, visibilityMap, mode);
            }
        }
    }

    /**
     * Request that the entity runs its onUpdate for components and children
     * @param tick the current game time tick
     */
    onUpdate(tick: number) {
        for (const component of this._componentsMap.values()) {
            component.onUpdate(tick);
        }

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].onUpdate(tick);
        }
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

    publishComponentEvent() {}

    bubbleEvent(event: EntityEvent) {
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
