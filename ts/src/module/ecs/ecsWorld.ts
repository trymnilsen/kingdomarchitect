import type { Bounds } from "../../common/bounds.js";
import type { ConstructorFunction } from "../../common/constructor.js";
import type { ComponentType } from "../../game/component/component.js";
import { TileComponent } from "../../game/component/tileComponent.js";
import { Entity } from "../../game/entity/entity.js";
import { EntityEventMap } from "../../game/entity/entityEvent.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../rendering/renderVisibilityMap.js";
import type { EntityAction } from "../action/entityAction.js";
import type { EntityId } from "./ecsEntity.js";
import {
    EcsEntityEventFunction,
    EcsEntityEvents,
    EcsInitFunction,
    EcsRenderFunction,
    EcsSystem,
    EcsUpdateFunction,
} from "./ecsSystem.js";

type EcsEntityEventHandlersMap = {
    // Iterate over each event ID 'K' which is a key in EntityEventMapDynamic
    [K in keyof EntityEventMap]: EcsEntityEventFunction<EntityEventMap[K]>[]; // ...of the specific event handler function type for that event. // For each key 'K', define the value as an array '[]' ...
    // Note: We are NOT using Partial<> here, so all keys are mandatory.
};

export type ParameterlessClassConstructor<
    T extends ComponentType = ComponentType,
> = new () => T;
export type EcsComponent = { constructor: ParameterlessClassConstructor };

export interface EcsWorld {
    query<T extends ParameterlessClassConstructor>(
        component: T,
    ): Map<Entity, InstanceType<T>>;
    queryWithin<T extends ParameterlessClassConstructor>(
        viewport: Bounds,
        component: T,
    ): Map<Entity, InstanceType<T>>;
    dispatch<T extends EntityAction>(action: T);
}

export class Ecs implements EcsWorld {
    private renderSystems: EcsRenderFunction[] = [];
    private initSystems: EcsInitFunction[] = [];
    private updateSystems: EcsUpdateFunction[] = [];
    private entityEvents: EcsEntityEventHandlersMap = {
        child_added: [],
        child_removed: [],
        component_added: [],
        component_removed: [],
        transform: [],
    };
    private rootEntity: Entity;

    public get root(): Entity {
        return this.rootEntity;
    }

    constructor() {
        this.rootEntity = new Entity("root");
        this.rootEntity.addEcsComponent(new TileComponent());
    }

    query<T extends ParameterlessClassConstructor>(
        component: T,
    ): Map<Entity, InstanceType<T>> {
        return this.rootEntity.queryComponents(component);
    }

    queryWithin<T extends ParameterlessClassConstructor>(
        _viewport: Bounds,
        component: T,
    ): Map<Entity, InstanceType<T>> {
        //TODO: Return only inside bounds based on the chunk map resource
        return this.query(component);
    }

    dispatch<T extends EntityAction>(_action: T) {
        throw new Error("Method not implemented.");
    }

    addSystem(system: EcsSystem) {
        if (!!system.onRender) {
            this.renderSystems.push(system.onRender);
        }

        if (!!system.onUpdate) {
            this.updateSystems.push(system.onUpdate);
        }

        if (!!system.onInit) {
            this.initSystems.push(system.onInit);
        }

        const entityEventsFromSystem = system.onEntityEvent;
        if (!!entityEventsFromSystem) {
            if (entityEventsFromSystem.child_added) {
                this.entityEvents.child_added.push(
                    entityEventsFromSystem.child_added,
                );
            }
            if (entityEventsFromSystem.child_removed) {
                this.entityEvents.child_removed.push(
                    entityEventsFromSystem.child_removed,
                );
            }
            if (entityEventsFromSystem.component_added) {
                this.entityEvents.component_added.push(
                    entityEventsFromSystem.component_added,
                );
            }
            if (entityEventsFromSystem.component_removed) {
                this.entityEvents.component_removed.push(
                    entityEventsFromSystem.component_removed,
                );
            }
            if (entityEventsFromSystem.transform) {
                this.entityEvents.transform.push(
                    entityEventsFromSystem.transform,
                );
            }
        }
    }

    runRender(
        renderScope: RenderScope,
        visiblityMap: RenderVisibilityMap,
        drawMode: DrawMode,
    ) {
        for (let i = 0; i < this.renderSystems.length; i++) {
            const system = this.renderSystems[i];
            system(this, renderScope, visiblityMap, drawMode);
        }
    }

    runUpdate(gameTime: number) {
        for (let i = 0; i < this.updateSystems.length; i++) {
            const system = this.updateSystems[i];
            system(this, gameTime);
        }
    }
}
