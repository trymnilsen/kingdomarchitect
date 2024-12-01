import { ComponentFn, EcsComponent } from "./ecsComponent.js";
import { EcsEntity, EcsSystem, QueryData, QueryObject } from "./ecsSystem.js";
import { SparseSet } from "../common/structure/sparseSet.js";
import { hasOwnProperty } from "../common/object.js";
import { EcsEvent } from "./ecsEvent.js";
import { EcsWorldScope } from "./ecsWorldScope.js";

export type MutableQueryData<T extends QueryObject = QueryObject> = {
    [P in keyof T]: SparseSet<InstanceType<T[P]>>;
};

export type QueryMap<T extends QueryObject = QueryObject> = Map<
    T,
    MutableQueryData<T>
>;

export class EcsWorld implements EcsWorldScope {
    private systems: EcsSystem[] = [];
    private components: Map<EcsEntity, Map<Function, EcsComponent>> = new Map();
    private queryMap: QueryMap = new Map();
    private nextEntityId: number = 1;

    dispatchEvent(event: EcsEvent) {
        for (let i = 0; i < this.systems.length; i++) {
            const system = this.systems[i];
            if (!system.hasEvent(event)) {
                continue;
            }

            const queryMapResult = this.queryMap.get(system.query);
            if (!!queryMapResult) {
                try {
                    system.onEvent(queryMapResult, event, this);
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
        for (const system of this.systems) {
            const set = this.getQueryMapSetForComponent(
                system,
                component.constructor as ComponentFn,
            );

            if (!!set) {
                set.add(component);
            }
        }
    }

    removeComponent(entity: EcsEntity, component: EcsComponent) {
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

        //Remove it from the query map also
        const querySets = this.systems
            .map((system) => {
                return this.getQueryMapSetForComponent(system, componentFn);
            })
            .filter((item) => item != null);

        for (const querySet of querySets) {
            querySet.delete(component);
        }
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
                this.removeComponent(entity, component[1]);
            }
        }
    }

    addSystem(system: EcsSystem) {
        this.systems.push(system as EcsSystem);
        const queryData: MutableQueryData = {};
        //Build query for query map
        for (const key in system.query) {
            if (!hasOwnProperty(system.query, key)) {
                continue;
            }

            const component = system.query[key];
            queryData[key] = new SparseSet();
        }

        //Find entities with components matching the query
        for (const [entity, componentMap] of this.components) {
            const entityQuery = this.queryEntity(entity, system.query);
            if (!entityQuery) {
                continue;
            }

            for (const key in entityQuery) {
                if (!hasOwnProperty(entityQuery, key)) {
                    continue;
                }

                queryData[key].add(entityQuery[key]);
            }
        }

        this.queryMap.set(system.query, queryData);
    }

    private getQueryMapSetForComponent(
        system: EcsSystem,
        component: ComponentFn,
    ): SparseSet<EcsComponent> | null {
        const query = system.query;
        const queryData = this.queryMap.get(query);
        if (!queryData) {
            return null;
        }

        const queryKey = Object.entries(query).find(
            ([_, value]) => value == component,
        );

        //If this query does not contain the component, return
        if (!queryKey) {
            return null;
        }

        const sparseSet = queryData[queryKey[0]];
        if (!!sparseSet) {
            return sparseSet;
        } else {
            throw new Error("Corrupt data, query had key not in query data");
        }
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
