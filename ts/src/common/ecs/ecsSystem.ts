import type { Entity } from "../../game/entity/entity.ts";
import type { EntityEvent, EntityEventType } from "../../game/entity/entityEvent.ts";
import { DrawMode } from "../../rendering/drawMode.ts";
import { RenderScope } from "../../rendering/renderScope.ts";
import type { GameEffect } from "../../server/message/effect/gameEffect.ts";
import type { GameCommand } from "../../server/message/gameCommand.ts";
import type { GameMessage } from "../../server/message/gameMessage.ts";

export type EcsRenderFunction = (
    root: Entity,
    renderTick: number,
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

export type EcsGameMessageFunction = (
    rootEntity: Entity,
    gameMessage: GameMessage,
) => void;

export interface EcsSystem {
    onRender?: EcsRenderFunction;
    onUpdate?: EcsUpdateFunction;
    onInit?: EcsInitFunction;
    onEntityEvent?: EcsEntityEvents;
    onGameMessage?: EcsGameMessageFunction;
}
