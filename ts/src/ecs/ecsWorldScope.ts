import { ConstructorFunction } from "../common/constructor.js";
import { Point } from "../common/point.js";
import { ComponentFn, EcsComponent } from "./ecsComponent.js";
import { EcsComponentRegistry } from "./ecsComponentRegistry.js";
import { EcsEntity } from "./ecsEntity.js";
import { TransformComponent } from "./transformComponent.js";

export interface EcsWorldScope {
    /**
     * The collection of components in the world
     */
    readonly components: EcsComponentRegistry;
    /**
     * Create a entity for use with components on a new entity.
     */
    createEntity(): EcsEntity;
    /**
     * Adds a component to an entity and updates the query cache. Any systems
     * listening for changes on a query that includes this component will run
     * immediately.
     * @param entity the entity to attach the component to
     * @param component the component to add
     */
    addComponent(entity: EcsEntity, component: EcsComponent): void;
    /**
     * Removes a component from a given entity and updates the query map for
     * this entity. Any systems listening for changes on a query that includes
     * this component will run immediately.
     * @param entity the entity to remove the component from
     * @param component the component instance to remove
     */
    removeComponent(entity: EcsEntity, component: EcsComponent): void;
    /**
     * Destroyes and removes an entity, effectively removing all components.
     * Any systems listening for changes on a query that includes this component
     * will run immediately.
     * @param entity the entity to remove
     */
    destroyEntity(entity: EcsEntity): void;
    /**
     * Dispatch an event that the transform for a component has been changed
     * @param transform
     */
    updateTransform(entity: EcsEntity, x: number, y: number);
}

export const RootEntity = 0;
