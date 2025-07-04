import { createTileComponent } from "../../game/component/tileComponent.js";
import { Entity } from "../../game/entity/entity.js";
import {
    EntityEventType,
    type EntityEvent,
} from "../../game/entity/entityEvent.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../rendering/renderVisibilityMap.js";
import {
    EcsEntityEventFunction,
    EcsInitFunction,
    EcsRenderFunction,
    EcsSystem,
    EcsUpdateFunction,
} from "./ecsSystem.js";

type EcsEntityEventHandlersMap = {
    // Iterate over each event ID 'K' which is a key in EntityEventMapDynamic
    [K in keyof EntityEventType]: EcsEntityEventFunction<EntityEvent>[]; // ...of the specific event handler function type for that event. // For each key 'K', define the value as an array '[]' ...
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
        component_updated: [],
        transform: [],
    };
    private rootEntity: Entity;

    public get root(): Entity {
        return this.rootEntity;
    }

    constructor() {
        this.rootEntity = new Entity("root");
        this.rootEntity.setEcsComponent(createTileComponent());
        this.rootEntity.entityEvent = this.runEvent;
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
                    entityEventsFromSystem.child_added as EcsEntityEventFunction<EntityEvent>,
                );
            }
            if (entityEventsFromSystem.child_removed) {
                this.entityEvents.child_removed.push(
                    entityEventsFromSystem.child_removed as EcsEntityEventFunction<EntityEvent>,
                );
            }
            if (entityEventsFromSystem.component_added) {
                this.entityEvents.component_added.push(
                    entityEventsFromSystem.component_added as EcsEntityEventFunction<EntityEvent>,
                );
            }
            if (entityEventsFromSystem.component_removed) {
                this.entityEvents.component_removed.push(
                    entityEventsFromSystem.component_removed as EcsEntityEventFunction<EntityEvent>,
                );
            }
            if (entityEventsFromSystem.component_updated) {
                this.entityEvents.component_updated.push(
                    entityEventsFromSystem.component_updated as EcsEntityEventFunction<EntityEvent>,
                );
            }
            if (entityEventsFromSystem.transform) {
                this.entityEvents.transform.push(
                    entityEventsFromSystem.transform as EcsEntityEventFunction<EntityEvent>,
                );
            }
        }
    }

    runInit() {
        for (let i = 0; i < this.initSystems.length; i++) {
            const system = this.initSystems[i];
            system(this.root);
        }
    }

    runRender(
        renderScope: RenderScope,
        visiblityMap: RenderVisibilityMap,
        drawMode: DrawMode,
    ) {
        for (let i = 0; i < this.renderSystems.length; i++) {
            const system = this.renderSystems[i];
            system(this.root, renderScope, visiblityMap, drawMode);
        }
    }

    runUpdate(gameTime: number) {
        for (let i = 0; i < this.updateSystems.length; i++) {
            const system = this.updateSystems[i];
            system(this.root, gameTime);
        }
    }

    runEvent = (event: EntityEvent) => {
        const events = this.entityEvents[event.id];
        for (let i = 0; i < events.length; i++) {
            const listener = events[i];
            listener(this.root, event);
        }
    };
}
