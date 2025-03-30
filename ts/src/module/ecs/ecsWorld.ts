import { Entity } from "../../game/entity/entity.js";
import { EntityEventMap } from "../../game/entity/entityEvent.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../rendering/renderVisibilityMap.js";
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

export class EcsWorld {
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

    constructor(rootEntity: Entity) {
        this.rootEntity = rootEntity;
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
            system(this.rootEntity, renderScope, visiblityMap, drawMode);
        }
    }

    runUpdate(gameTime: number) {
        for (let i = 0; i < this.updateSystems.length; i++) {
            const system = this.updateSystems[i];
            system(this.rootEntity, gameTime);
        }
    }
}
