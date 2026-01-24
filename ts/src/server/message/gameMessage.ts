import type { Point } from "../../common/point.ts";
import type { Components } from "../../game/component/component.ts";
import type { Entity } from "../../game/entity/entity.ts";
import type { TileChunk } from "../../game/map/chunk.ts";
import type { Volume } from "../../game/map/volume.ts";
import type { GameEffect } from "./effect/gameEffect.ts";
import type { GameCommand } from "./gameCommand.ts";

export type GameMessage =
    | WorldStateGameMessage
    | AddEntityGameMessage
    | RemoveEntityGameMessage
    | SetComponentGameMessage
    | ComponentDeltaGameMessage
    | TransformGameMessage
    | EffectGameMessage
    | CommandGameMessage;

export const WorldStateMessageType = "worldState";
export const AddEntityGameMessageType = "addEntity";
export const RemoveEntityGameMessageType = "removeEntity";
export const SetComponentGameMessageType = "setComponent";
export const ComponentDeltaGameMessageType = "componentDelta";
export const TransformGameMessageType = "transform";
export const EffectGameMessageType = "effect";
export const CommandGameMessageType = "command";

export type ReplicatedEntityData = {
    id: string;
    position: Point;
    parent?: string;
    components: readonly Components[];
    children?: ReplicatedEntityData[];
};

/**
 * Replicates a full snapshot of the world for the intial state when loading
 * or creating a fresh new game
 */
export type WorldStateGameMessage = {
    type: typeof WorldStateMessageType;
    // The entities added to the root node, will visit children as well
    // so we should only add the first level
    rootChildren: ReplicatedEntityData[];
    chunks: { x: number; y: number; volume: string }[];
    volumes: Volume[];
};

export type AddEntityGameMessage = {
    type: typeof AddEntityGameMessageType;
} & ReplicatedEntityData;

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
