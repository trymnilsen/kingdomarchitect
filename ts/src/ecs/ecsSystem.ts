import type { Entity } from "../game/entity/entity.ts";
import type { ComponentID } from "../game/component/component.ts";
import type {
    ComponentsUpdatedEvent,
    EntityEvent,
    EntityEventType,
} from "../game/entity/entityEvent.ts";
import { DrawMode } from "../rendering/drawMode.ts";
import { RenderScope } from "../rendering/renderScope.ts";
import type { GameCommand } from "../server/message/gameCommand.ts";
import type { GameMessage } from "../server/message/gameMessage.ts";

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

export type EcsComponentEventFunction<ID extends ComponentID> = (
    root: Entity,
    event: ComponentsUpdatedEvent<ID>,
) => void;

/**
 * Handlers keyed by the component id they listen to. Each handler receives an
 * event whose `item` is narrowed to that component's type.
 */
export type EcsComponentHandlers = Partial<{
    [ID in ComponentID]: EcsComponentEventFunction<ID>;
}>;

/**
 * Subscriptions to changes of specific component types. The world only calls a
 * handler for the components it asked for, so a system that cares about one
 * component does not see every update on every entity the way a
 * `component_updated` entity event handler does.
 *
 * There is no separate "added" subscription. `updated` fires when a component
 * is set for the first time, replaced, or changed, because an entity holds at
 * most one component per id and the three are the same thing to a listener.
 */
export type EcsComponentEvents = {
    updated?: EcsComponentHandlers;
    removed?: EcsComponentHandlers;
};

export interface EcsSystem {
    onRender?: EcsRenderFunction;
    onUpdate?: EcsUpdateFunction;
    onInit?: EcsInitFunction;
    onEntityEvent?: EcsEntityEvents;
    onComponent?: EcsComponentEvents;
    onGameMessage?: EcsGameMessageFunction;
}
