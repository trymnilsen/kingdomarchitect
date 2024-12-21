import { ComponentFn, EcsComponent } from "./ecsComponent.js";
import { EcsEntity } from "./ecsEntity.js";
import { QueryObject } from "./ecsSystem.js";

/**
 * A collection of components and their relation to entities.
 * Allows for create and delete operations as well as query functions
 */
export interface EcsComponentRegistry {
    /**
     * Check if this world has a given entity
     * @param entity
     * @returns if the world has any components attached to this entity
     */
    hasEntity(entity: EcsEntity): boolean;
    /**
     * Query and retrieve a list of entities containing a given type
     * @param componentType constructor for the component type
     */
    queryEntities(componentType: ComponentFn): EcsEntity[];
    /**
     * Query and retrieve a list of components on entities.
     * @param componentType
     */
    queryComponents<T extends EcsComponent>(componentType: ComponentFn<T>): T[];
    /*
     * Get the component of a given type on an specific entity
     */
    getComponent<T extends EcsComponent>(
        entity: EcsEntity,
        componentType: ComponentFn<T>,
    ): T | null;
}

export class MutableEcsComponentRegistry implements EcsComponentRegistry {
    private components: Map<EcsEntity, Map<Function, EcsComponent>> = new Map();

    /**
     * Adds a component to an entity. Throws an error if the entity already has a component
     * of the same type.
     *
     * @param entity The entity to which the component will be added.
     * @param component The component instance to be added.
     * @throws If the entity already has a component of the same type.
     */
    addComponent(entity: EcsEntity, component: EcsComponent) {
        let componentContainer = this.components.get(entity);
        const componentFn = component.constructor;

        if (componentContainer?.has(componentFn)) {
            throw Error(
                `Entity ${entity} already has a ${componentFn.name} component`,
            );
        }

        if (!componentContainer) {
            componentContainer = new Map();
            this.components.set(entity, componentContainer);
        }
        component.entity = entity;
        componentContainer.set(componentFn, component);
    }

    /**
     * Removes a component from an entity. If the entity has no more components,
     * it is removed from the registry.
     *
     * @param entity The entity from which the component will be removed.
     * @param component The component instance to be removed.
     */
    removeComponent(entity: EcsEntity, component: EcsComponent) {
        const componentFn = component.constructor;
        const componentMap = this.components.get(entity);

        if (componentMap) {
            const component = componentMap.get(componentFn);
            if (!!component) {
                component.entity = undefined;
            }
            componentMap.delete(componentFn);
            if (componentMap.size === 0) {
                this.components.delete(entity);
            }
        }
    }

    /**
     * Removes all components associated with an entity.
     *
     * @param entity The entity to remove from the registry.
     */
    removeAllForEntity(entity: EcsEntity) {
        const components = this.components.get(entity);
        if (!!components) {
            const componentsOnEntity = components.values();
            for (const component of componentsOnEntity) {
                //Reuse the logic for removing a single component
                this.removeComponent(entity, component);
            }
        }
    }

    queryEntities(componentType: ComponentFn): EcsEntity[] {
        const entities: EcsEntity[] = [];
        for (const [entity, componentList] of this.components) {
            if (componentList.has(componentType)) {
                entities.push(entity);
            }
        }

        return entities;
    }

    queryComponents<T extends EcsComponent>(
        componentType: ComponentFn<T>,
    ): T[] {
        const components: T[] = [];
        for (const [entity, componentList] of this.components) {
            const component = componentList.get(componentType);
            if (!!component) {
                components.push(component as T);
            }
        }

        return components;
    }

    getComponent<T extends EcsComponent>(
        entity: EcsEntity,
        componentType: ComponentFn,
    ): T | null {
        return (this.components.get(entity)?.get(componentType) as T) || null;
    }

    /**
     * Retrieves all components associated with an entity.
     *
     * @param entity The entity whose components will be retrieved.
     * @returns A map of component constructors to component instances, or `null`
     * if the entity has no components.
     */
    getComponents(entity: EcsEntity): Map<Function, EcsComponent> | null {
        return this.components.get(entity) ?? null;
    }

    /**
     * Checks if an entity is present in the registry with at least one component.
     *
     * @param entity The entity to check.
     * @returns `true` if the entity exists in the registry with components, `false` otherwise.
     */
    hasEntity(entity: EcsEntity): boolean {
        const components = this.components.get(entity);
        return !!components && components.size > 0;
    }

    /**
     * Checks if the entity has the components need to match the query provided
     * If it does an object with the same keys as the query and the instances
     * of the components on the entity is returned. All components in the
     * query needs to be present to be conssidered a match. Components not in the
     * query but existing on the entity is ignored and not added to the returned
     * object
     * @param entity the entity to check for components on
     * @param query the query to check components against
     * @returns the matching componets or null if there was no match
     */
    queryEntity(
        entity: EcsEntity,
        query: QueryObject,
    ): { [id: string]: EcsComponent } | null {
        const entityComponents = this.getComponents(entity);
        if (!entityComponents) {
            return null;
        }

        const result: { [id: string]: EcsComponent } = {};
        for (const [key, componentFn] of Object.entries(query)) {
            const componentInstance = entityComponents.get(componentFn);
            if (!componentInstance) {
                return null;
            }
            result[key] = componentInstance;
        }
        return result;
    }
}
