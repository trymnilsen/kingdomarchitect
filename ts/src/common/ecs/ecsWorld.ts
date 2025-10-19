import { createSpaceComponent } from "../../game/component/spaceComponent.js";
import { Entity } from "../../game/entity/entity.js";
import {
    EntityEventType,
    type EntityEvent,
} from "../../game/entity/entityEvent.js";
import { overWorldId } from "../../game/map/spaces.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import type { GameCommand } from "../../server/message/gameCommand.js";
import type { GameMessage } from "../../server/message/gameMessage.js";
import {
    EcsEntityEventFunction,
    EcsInitFunction,
    EcsRenderFunction,
    EcsSystem,
    EcsUpdateFunction,
    type EcsGameMessageFunction,
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
    private scopedEntity: Entity;
    private gameMessageSystems: EcsGameMessageFunction[] = [];

    public get root(): Entity {
        return this.rootEntity;
    }

    public get scopedRoot(): Entity {
        return this.scopedEntity;
    }

    constructor() {
        this.rootEntity = new Entity("root");
        const overworld = new Entity(overWorldId);
        overworld.setEcsComponent(createSpaceComponent());
        this.rootEntity.addChild(overworld);
        this.scopedEntity = overworld;
        this.rootEntity.toggleIsGameRoot(true);
        this.rootEntity.entityEvent = this.runEvent;
    }

    rescope(entity: Entity) {
        //Check that the given entity is part of the tree
        if (entity.getRootEntity() !== this.rootEntity) {
            throw new Error("Cannot rescope to an entity not in entity tree");
        }

        this.scopedEntity = entity;
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

        if (!!system.onGameMessage) {
            this.gameMessageSystems.push(system.onGameMessage);
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

    runGameMessage(message: GameMessage) {
        for (let i = 0; i < this.gameMessageSystems.length; i++) {
            const system = this.gameMessageSystems[i];
            system(this.root, this.scopedEntity, message);
        }
    }

    runInit() {
        for (let i = 0; i < this.initSystems.length; i++) {
            const system = this.initSystems[i];
            system(this.root, this.scopedEntity);
        }
    }

    runRender(
        renderScope: RenderScope,
        renderTick: number,
        drawMode: DrawMode,
    ) {
        for (let i = 0; i < this.renderSystems.length; i++) {
            const system = this.renderSystems[i];
            system(
                this.root,
                this.scopedEntity,
                renderTick,
                renderScope,
                drawMode,
            );
        }
    }

    runUpdate(gameTime: number) {
        for (let i = 0; i < this.updateSystems.length; i++) {
            const system = this.updateSystems[i];
            system(this.root, this.scopedEntity, gameTime);
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
