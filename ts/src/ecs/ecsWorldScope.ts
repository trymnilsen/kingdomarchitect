import { Point } from "../common/point.js";
import { EcsComponent } from "./ecsComponent.js";
import { EcsEntity } from "./ecsSystem.js";
import { TransformComponent } from "./transformComponent.js";

export interface EcsWorldScope {
    /**
     * Create an entity in the world.
     * @param initialPosition the start position of the entity
     */
    createEntity(initialPosition?: Point): EcsEntity;
    /**
     * Adds a component to an entity and updates the query cache
     * @param entity the entity to attach the component to
     * @param component the component to add
     */
    addComponent(entity: EcsEntity, component: EcsComponent);
    /**
     * Removes a component from a given entity and updates the query map for
     * this entity
     * @param entity the entity to remove the component from
     * @param component the component instance to remove
     */
    removeComponent(entity: EcsEntity, component: EcsComponent);
    /**
     * Destroyes and removes an entity, effectively removing all components
     * @param entity the entity to remove
     */
    destroyEntity(entity: EcsEntity);
    /**
     * Update the location position of an entity's transform component. Will
     * also handle updating the world position if the entity has a parent transform.
     * @param entity
     * @param position
     */
    setLocalEntityPosition(entity: EcsEntity, position: Point);
    /**
     * Sets the world position of this entity.
     * If the entity has a parent it will also update the local positon to be
     * relative to the parent for the new world position
     * @param entity
     * @param position
     */
    setWorldEntityPosition(entity: EcsEntity, position: Point);
    /**
     * Sets a parent on a transform for an entity
     * @throws if there would be a circular loop
     * @param child
     * @param parent
     */
    setParent(child: EcsEntity, parent: EcsEntity);
}
