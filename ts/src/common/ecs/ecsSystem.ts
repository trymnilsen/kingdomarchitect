import { Entity } from "../../game/entity/entity.js";
import { EntityEvent, EntityEventType } from "../../game/entity/entityEvent.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import type { GameCommand } from "../../server/message/gameCommand.js";

export type EcsRenderFunction = (
    root: Entity,
    renderScope: RenderScope,
    drawMode: DrawMode,
) => void;

export type EcsUpdateFunction = (root: Entity, updateTime: number) => void;

export type EcsEntityEventFunction<T extends EntityEvent> = (
    root: Entity,
    event: T,
) => void;

export type EcsInitFunction = (rootEntity: Entity) => void;

export type EcsEntityEvents = Partial<{
    [k in EntityEvent["id"]]: EcsEntityEventFunction<EntityEventType[k]>;
}>;

export type EcsCommand = { [id: string]: GameCommand };

export interface EcsSystem {
    onRender?: EcsRenderFunction;
    onUpdate?: EcsUpdateFunction;
    onInit?: EcsInitFunction;
    onEntityEvent?: EcsEntityEvents;
    onCommand?: EcsCommand;
}
