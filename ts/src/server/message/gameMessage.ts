import type { Point } from "../../common/point.js";
import type { Components } from "../../game/component/component.js";
import type { Entity } from "../../game/entity/entity.js";
import type { GameEffect } from "./effect/gameEffect.js";
import type { GameCommand } from "./gameCommand.js";

export type GameMessage =
    | AddEntityGameMessage
    | RemoveEntityGameMessage
    | SetComponentGameMessage
    | ComponentDeltaGameMessage
    | TransformGameMessage
    | EffectGameMessage
    | CommandGameMessage;

export const AddEntityGameMessageType = "addEntity";
export const RemoveEntityGameMessageType = "removeEntity";
export const SetComponentGameMessageType = "setComponent";
export const ComponentDeltaGameMessageType = "componentDelta";
export const TransformGameMessageType = "transform";
export const EffectGameMessageType = "effect";
export const CommandGameMessageType = "command";

export type AddEntityGameMessage = {
    type: typeof AddEntityGameMessageType;
    entity: {
        id: string;
        position: Point;
        parent?: string;
    };
    components: readonly Components[];
};

export type RemoveEntityGameMessage = {
    type: typeof RemoveEntityGameMessageType;
    entity: string;
};

export type SetComponentGameMessage = {
    type: typeof SetComponentGameMessageType;
    component: Components;
    entity: string;
};

export type ComponentDeltaGameMessage = {
    type: typeof ComponentDeltaGameMessageType;
};

export type TransformGameMessage = {
    type: typeof TransformGameMessageType;
    entity: string;
    oldPosition: Point;
    position: Point;
};

export type EffectGameMessage = {
    type: typeof EffectGameMessageType;
    effect: GameEffect;
};

export type CommandGameMessage = {
    type: typeof CommandGameMessageType;
    command: GameCommand;
};
