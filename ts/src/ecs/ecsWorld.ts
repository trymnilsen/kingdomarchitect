import { EcsComponent } from "./ecsComponent.js";
import {
    EcsComponentRegistry,
    MutableEcsComponentRegistry,
} from "./ecsComponentRegistry.js";
import { EcsEntity } from "./ecsEntity.js";
import { EcsSystem, QueryData, QueryObject } from "./ecsSystem.js";
import { EcsWorldScope, RootEntity } from "./ecsWorldScope.js";
import {
    ComponentEventType,
    EcsComponentEvent,
} from "./event/ecsComponentEvent.js";
import { EcsEvent } from "./event/ecsEvent.js";
import { EcsTransformEvent } from "./event/ecsTransformEvent.js";
import { TransformComponent } from "./transformComponent.js";

export type QueryMap<TQueryMap extends QueryObject = QueryObject> = Map<
    TQueryMap,
    Map<EcsEntity, QueryData<TQueryMap>>
>;

export class EcsWorld implements EcsWorldScope {
    private systems: EcsSystem[] = [];
    private componentCollection = new MutableEcsComponentRegistry();
    private queryMap: QueryMap = new Map();
    private nextEntityId: number = RootEntity + 1;

    public get components(): EcsComponentRegistry {
        return this.componentCollection;
    }

    addComponent(entity: EcsEntity, component: EcsComponent) {
        this.componentCollection.addComponent(entity, component);
        this.updateQueryMapForEntity(entity);
        this.dispatchComponentEvent(component, ComponentEventType.Add);
    }

    removeComponent(entity: EcsEntity, component: EcsComponent) {
        if (!this.componentCollection.hasEntity(entity)) {
            return;
        }

        this.componentCollection.removeComponent(entity, component);
        this.updateQueryMapForEntity(entity);
        this.dispatchComponentEvent(component, ComponentEventType.Remove);
    }

    createEntity(): EcsEntity {
        return this.nextEntityId++;
    }

    destroyEntity(entity: EcsEntity) {
        const components = this.componentCollection.getComponents(entity);
        if (!components) {
            return;
        }

        this.componentCollection.removeAllForEntity(entity);
        this.updateQueryMapForEntity(entity);
        this.dispatchComponentEvent(
            Array.from(components.values()),
            ComponentEventType.Remove,
        );
    }

    updateTransform(entity: EcsEntity, x: number, y: number): void {
        const transform = this.components.getComponent(
            entity,
            TransformComponent,
        );
        if (!transform) {
            return;
        }

        const position = { x: transform.position.x, y: transform.position.y };
        transform.position.x = x;
        transform.position.y = y;
        this.dispatchEvent(
            new EcsTransformEvent(transform, transform.position, position),
        );
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

    private dispatchComponentEvent(
        component: EcsComponent | EcsComponent[],
        eventType: ComponentEventType,
    ) {
        this.dispatchEvent(new EcsComponentEvent(component, eventType));
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
}
