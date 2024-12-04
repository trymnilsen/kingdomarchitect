import { ComponentFn, EcsComponent } from "./ecsComponent.js";
import { EcsEntity, EcsSystem, QueryData, QueryObject } from "./ecsSystem.js";
import { SparseSet } from "../common/structure/sparseSet.js";
import { hasOwnProperty } from "../common/object.js";
import { EcsEvent } from "./ecsEvent.js";
import { EcsWorldScope } from "./ecsWorldScope.js";

export type QueryMap2<TQueryMap extends QueryObject = QueryObject> = Map<
    TQueryMap,
    Map<EcsEntity, QueryData<TQueryMap>>
>;

export class EcsWorld implements EcsWorldScope {
    private systems: EcsSystem[] = [];
    private components: Map<EcsEntity, Map<Function, EcsComponent>> = new Map();
    private queryMap: QueryMap2 = new Map();
    private nextEntityId: number = 1;

    constructor(systems: EcsSystem[]) {
        this.systems = systems;
        for (const system of systems) {
            this.queryMap.set(system.query, new Map());
        }
    }

    dispatchEvent(event: EcsEvent) {
        for (let i = 0; i < this.systems.length; i++) {
            const system = this.systems[i];
            if (!system.hasEvent(event)) {
                continue;
            }

            const queryMapResult = this.queryMap.get(system.query);
            if (!!queryMapResult) {
                try {
                    system.onEvent(queryMapResult.values(), event, this);
                } catch (err) {
                    console.error(
                        "Failed running dispatch for system",
                        system,
                        event,
                        err,
                    );
                    throw err;
                }
            }
        }
    }

    createEntity(): EcsEntity {
        return this.nextEntityId++;
    }

    addComponent(entity: EcsEntity, component: EcsComponent) {
        //Add the components to our container as well
        let componentContainer = this.components.get(entity);
        if (!componentContainer) {
            const newContainer = new Map();
            this.components.set(entity, newContainer);
            componentContainer = newContainer;
        }

        componentContainer.set(component.constructor, component);
        //Update the cache of queries when a component is added
        //to avoid taking this cost in the update loop
        //Add to query map
        this.updateQueryMapForEntity(entity);
    }

    removeComponent(entity: EcsEntity, component: EcsComponent) {
        this.removeComponentInternal(entity, component);
        this.updateQueryMapForEntity(entity);
    }

    hasEntity(entity: EcsEntity): boolean {
        const components = this.components.get(entity);
        return !!components && components.size > 0;
    }

    destroyEntity(entity: EcsEntity) {
        //Remove all components on entity
        const components = this.components.get(entity);
        if (!!components) {
            for (const component of components) {
                this.removeComponentInternal(entity, component[1]);
            }
        }
        //Run the check once after removing all components
        this.updateQueryMapForEntity(entity);
    }

    //TODO: this needs a better name
    private removeComponentInternal(
        entity: EcsEntity,
        component: EcsComponent,
    ) {
        const componentMap = this.components.get(entity);
        //Remove the component from the component map
        const componentFn = component.constructor as ComponentFn;
        if (!!componentMap) {
            componentMap.delete(componentFn);
            //If this causes the map to be empty we remove the map
            if (componentMap.size == 0) {
                this.components.delete(entity);
            }
        }
    }

    /**
     * Loop over all systems and check if the query of that system matches the
     * entity. If it does not remove it from the query map if present and
     * add it to the query map if it matches but is not present
     * @param entity
     */
    private updateQueryMapForEntity(entity: EcsEntity) {
        //First check if the entity exists still in the component map
        //it might have been removed. No need to continue further if it does not
        //exists ¯\_(ツ)_/¯.
        if (!this.components.has(entity)) {
            for (const system of this.systems) {
                this.clearQueryMapForEntity(entity, system);
            }

            return;
        }

        for (const system of this.systems) {
            const queryResult = this.queryEntity(entity, system.query);
            if (!!queryResult) {
                const map = this.queryMap.get(system.query);
                if (!map) {
                    throw new Error(
                        "Possible data corruption, no map instance for system",
                    );
                }

                map.set(entity, queryResult);
            } else {
                // The entity did not match the query for the system, we should
                // remove it
                this.clearQueryMapForEntity(entity, system);
            }
        }
    }

    private clearQueryMapForEntity(entity: EcsEntity, system: EcsSystem) {
        this.queryMap.get(system.query)?.delete(entity);
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
    private queryEntity(
        entity: EcsEntity,
        query: QueryObject,
    ): { [id: string]: EcsComponent } | null {
        const entityComponents = this.components.get(entity);

        if (!entityComponents) {
            // The entity has no components; return null as it cannot match any query.
            return null;
        }

        const result: { [id: string]: EcsComponent } = {};

        for (const [key, componentFn] of Object.entries(query)) {
            // Check if the entity has the requested component type.
            const componentInstance = entityComponents.get(componentFn);

            if (!componentInstance) {
                // If a required component is missing, the entity doesn't match the query.
                return null;
            }

            // Add the matching component to the result object.
            result[key] = componentInstance;
        }

        return result;
    }
}
