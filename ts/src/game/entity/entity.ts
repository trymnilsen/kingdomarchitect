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
    subtractPoint,
    zeroPoint,
} from "../../common/point.js";
import { RenderContext } from "../../rendering/renderContext.js";
import { ComponentEvent } from "../component/componentEvent.js";
import { EntityComponent } from "../component/entityComponent.js";
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

    private _componentsMap: Record<string, EntityComponent> = {};
    private _components: EntityComponent[] = [];
    constructor(readonly id: string) {}

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
        this._localPosition = position;
        this.updateTransform();
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
        return this._components;
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
        // Update the transform of the entity (also bubbles a transform
        // change adding the entity ot the chunk map if its not present)
        entity.updateTransform();
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

        if (this._componentsMap[componentName]) {
            throw new InvalidArgumentError(
                `Component already added ${componentName}`,
            );
        }
        entityComponent.entity = this;
        // call any lifecycle methods on the component if we are attached
        if (this.isAttached()) {
            entityComponent.onStart(0);
        }

        this._componentsMap[componentName] = entityComponent;
        this._components = Object.values(this._componentsMap);
    }

    /**
     * Removes a component from the entity
     * @param entityComponent the component to remove
     * @returns true if the removal was successful
     */
    removeComponent(entityComponent: EntityComponent): boolean {
        const componentName = getConstructorName(entityComponent);
        if (this._componentsMap[componentName]) {
            delete this._componentsMap[componentName];
            this._components = Object.values(this._componentsMap);
            if (this._parent) {
                entityComponent.onStop(0);
            }
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
     * @returns the component if it exists or null
     */
    getComponent<TFilter extends EntityComponent>(
        filterType: ConstructorFunction<TFilter>,
    ): TFilter | null {
        const componentId = filterType.name;
        const component = this._componentsMap[componentId] as TFilter;
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
     * Request the entity runs its onDraw for components and children.
     * Note: this method has a varying frequency of updates. Any logic that
     * needs a consistent update cycle should be called in onUpdate
     * @param renderContext the context used to render anything to the canvas
     */
    onDraw(renderContext: RenderContext) {
        if (this._components.length > 0) {
            //Calculating the screen position once for components
            const screenPosition = renderContext.camera.tileSpaceToScreenSpace(
                this._worldPosition,
            );
            for (const component of this._components) {
                component.onDraw(renderContext, screenPosition);
            }
        }

        for (const child of this._children) {
            child.onDraw(renderContext);
        }
    }

    /**
     * Request that the entity runs its onUpdate for components and children
     * @param tick the current game time tick
     */
    onUpdate(tick: number) {
        for (const component of this._components) {
            component.onUpdate(tick);
        }

        for (const child of this._children) {
            child.onUpdate(tick);
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
        for (const child of this._children) {
            child.updateTransform();
        }
    }

    publishComponentEvent() {}

    bubbleEvent(event: EntityEvent) {
        this._entityEvents.publish(event);
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
