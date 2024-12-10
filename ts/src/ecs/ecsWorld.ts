import { ComponentFn, EcsComponent } from "./ecsComponent.js";
import { EcsSystem, QueryData, QueryObject } from "./ecsSystem.js";
import { hasOwnProperty } from "../common/object.js";
import { EcsEvent } from "./ecsEvent.js";
import { EcsWorldScope } from "./ecsWorldScope.js";
import { Point, zeroPoint } from "../common/point.js";
import { EcsComponentRegistry } from "./ecsComponentRegistry.js";
import { EcsEntity } from "./ecsEntity.js";
import { TransformComponent } from "./transformComponent.js";

export type QueryMap<TQueryMap extends QueryObject = QueryObject> = Map<
    TQueryMap,
    Map<EcsEntity, QueryData<TQueryMap>>
>;

export class EcsWorld implements EcsWorldScope {
    private systems: EcsSystem[] = [];
    private componentCollection = new EcsComponentRegistry();
    private queryMap: QueryMap = new Map();
    private nextEntityId: number = 1;

    addComponent(entity: EcsEntity, component: EcsComponent) {
        this.componentCollection.addComponent(entity, component);
        this.updateQueryMapForEntity(entity);
    }

    removeComponent(entity: EcsEntity, component: EcsComponent) {
        this.componentCollection.removeComponent(entity, component);
        this.updateQueryMapForEntity(entity);
    }

    createEntity(initialPoint: Point = zeroPoint()): EcsEntity {
        const entityId = this.nextEntityId++;
        this.addComponent(entityId, new TransformComponent(initialPoint));
        return entityId;
    }

    destroyEntity(entity: EcsEntity) {
        this.componentCollection.removeAllForEntity(entity);
        //TODO: Remove any potential children and update parent list
        this.updateQueryMapForEntity(entity);
    }

    setParent(child: EcsEntity, parent: EcsEntity) {
        const parentTransform = this.transformOf(parent);
        const childTransform = this.transformOf(child);
        //TODO: Verify that there is not a circular loop of children
        childTransform.parent = parent;
        if (!parentTransform.children) {
            parentTransform.children = new Set();
        }

        parentTransform.children.add(child);
    }

    setLocalEntityPosition(entity: EcsEntity, position: Point) {
        throw new Error("Method not implemented.");
    }

    setWorldEntityPosition(entity: EcsEntity, position: Point) {
        throw new Error("Method not implemented.");
    }

    /**
     * Check if this system has a given entity
     * @param entity
     * @returns if the world has any components attached to this entity
     */
    hasEntity(entity: EcsEntity): boolean {
        return this.componentCollection.hasEntity(entity);
    }

    /**
     * Adds a system to the world. Should be run before any dispatching
     * @param systems a list of systems to add
     */
    addSystems(systems: EcsSystem[]) {
        this.systems = systems;
        for (const system of systems) {
            this.queryMap.set(system.query, new Map());
        }
    }

    /**
     * Retrieve all systems
     * @returns a readonly list of all systems in this world
     */
    allSystems(): ReadonlyArray<EcsSystem> {
        return this.systems;
    }

    /**
     * Dispatches an ECS event to all systems that might be listening for the
     * event. Each system will get the matching components for their query in
     * the event listener
     * @param event the Event to dispatch
     */
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
        if (!this.componentCollection.hasEntity(entity)) {
            for (const system of this.systems) {
                this.clearQueryMapForEntity(entity, system);
            }

            return;
        }

        for (const system of this.systems) {
            const queryResult = this.componentCollection.queryEntity(
                entity,
                system.query,
            );

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

    private transformOf(entity: EcsEntity): TransformComponent {
        const component = this.componentCollection.getComponent(
            entity,
            TransformComponent,
        );
        if (!component) {
            throw new Error(
                `entity ${entity} did not have a transform component`,
            );
        }

        return component as TransformComponent;
    }
}
