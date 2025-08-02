import type { GameEffect } from "./effect/gameEffect.js";
import type { GameCommand } from "./gameCommand.js";

export type GameMessage =
    | AddEntityGameMessage
    | SetComponentGameMessage
    | ComponentDeltaGameMessage
    | TransformGameMessage
    | EffectGameMessage
    | CommandGameMessage;

export type AddEntityGameMessage = {
    type: "addEntity";
};

export type SetComponentGameMessage = {
    type: "setComponent";
};

export type ComponentDeltaGameMessage = {
    type: "componentDelta";
};

export type TransformGameMessage = {
    type: "transform";
};

export type EffectGameMessage = {
    type: "effect";
    effect: GameEffect;
};

export type CommandGameMessage = {
    type: "command";
    command: GameCommand;
};
