import { ConstructorFunction } from "../../common/constructor.js";
import { ReadableSet, SparseSet } from "../../common/structure/sparseSet.js";
import { selectFromChild } from "../entity/child/select.js";
import { Entity } from "../entity/entity.js";
import { EntityComponent } from "./entityComponent.js";

export type ComponentMap<T extends ConstructorFunction<EntityComponent>[]> = {
    [K in T[number] as K extends { name: infer Name extends string }
        ? Name
        : never]: InstanceType<K>;
};
export type QueryData<T extends QueryObject = QueryObject> = {
    [P in keyof T]: InstanceType<T[P]>;
};

export interface QueryObject<T extends ComponentFn = ComponentFn> {
    [componentName: string]: T;
}

function entityMatchesQuery(query: QueryObject, entity: Entity): boolean {
    return Object.values(query).every(
        (ctorFn) => !!entity.getComponent(ctorFn),
    );
}

function getQueryData(query: QueryObject, entity: Entity): QueryData {
    const builtQueryData = Object.entries(query).map(([name, ctorFn]) => [
        name,
        entity.requireComponent(ctorFn),
    ]);
    return Object.fromEntries(builtQueryData);
}

export type ComponentFn<T extends EntityComponent = EntityComponent> =
    ConstructorFunction<T>;

export class ComponentsQueryCache2 {
    private _components = new Map<QueryObject, Map<string, QueryData>>();
    constructor(private root: Entity) {}
    query<T extends QueryObject>(query: T): Iterable<QueryData<T>> {
        if (Object.keys(query).length == 0) {
            return [];
        }

        const componentList = this._components.get(query);
        if (componentList) {
            return componentList.values() as Iterable<QueryData<T>>;
        } else {
            // Search for query
            const matchingComponents = selectFromChild(this.root, (child) => {
                if (entityMatchesQuery(query, child)) {
                    const queryData = getQueryData(query, child);
                    return [child.id, queryData] as const;
                } else {
                    return null;
                }
            });
            const map = new Map(matchingComponents);
            this._components.set(query, map);
            return map.values() as Iterable<QueryData<T>>;
        }
    }

    removeEntity(entity: Entity) {
        for (const map of this._components.values()) {
            map.delete(entity.id);
        }
    }
    addEntity(entity: Entity) {
        //Check if any of the currently cached queries matches the entity
        for (const [key, value] of this._components) {
            if (entityMatchesQuery(key, entity)) {
                value.set(entity.id, getQueryData(key, entity));
            }
        }
    }
    removeComponent(component: EntityComponent) {
        const entityComponentDeletedFrom = component.entity;
        for (const [key, value] of this._components) {
            // Check if this entity was part of the cached query and
            // if the entity still matches.
            if (
                value.has(entityComponentDeletedFrom.id) &&
                !entityMatchesQuery(key, entityComponentDeletedFrom)
            ) {
                value.delete(entityComponentDeletedFrom.id);
            }
        }
    }
    addComponent(component: EntityComponent) {
        const entityAddedOn = component.entity;
        for (const [key, value] of this._components) {
            // If the entity already exists in the cached value, no need to do
            // anything more, we might have added a component C on an entity
            // where we are interested in A and B
            if (value.has(entityAddedOn.id)) {
                continue;
            }

            // Check if this entity was part of the cached query and
            // if the entity still matches.
            if (entityMatchesQuery(key, entityAddedOn)) {
                value.set(entityAddedOn.id, getQueryData(key, entityAddedOn));
            }
        }
    }
}
