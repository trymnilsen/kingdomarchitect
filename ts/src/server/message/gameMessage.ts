import type { Point } from "../../common/point.ts";
import type {
    ComponentID,
    Components,
} from "../../game/component/component.ts";
import type { Terrain } from "../../game/map/terrain.ts";
import type { Volume } from "../../game/map/volume.ts";
import type { DeltaOperation } from "../delta/deltaTypes.ts";
import type { GameCommand } from "./gameCommand.ts";

export type GameMessage =
    | WorldStateGameMessage
    | AddEntityGameMessage
    | RemoveEntityGameMessage
    | SetComponentGameMessage
    | RemoveComponentGameMessage
    | ComponentDeltaGameMessage
    | TransformGameMessage
    | GroundUpdateGameMessage
    | ReloadGameMessage
    | CommandGameMessage
    | EventGameMessage;

export type EventGameMessage = {
    type: typeof EventGameMessageType;
    sourceEntityId: string;
    eventType: string;
    payload: unknown;
};

export const EventGameMessageType = "event";
export const CueGameMessageType = "cue";
export const WorldStateMessageType = "worldState";
export const AddEntityGameMessageType = "addEntity";
export const RemoveEntityGameMessageType = "removeEntity";
export const SetComponentGameMessageType = "setComponent";
export const RemoveComponentGameMessageType = "removeComponent";
export const ComponentDeltaGameMessageType = "componentDelta";
export const TransformGameMessageType = "transform";
export const GroundUpdateGameMessageType = "groundUpdate";
export const ReloadGameMessageType = "reloadGame";
export const CommandGameMessageType = "command";

export type ReplicatedEntityData = {
    id: string;
    /** World-space position of the entity */
    position: Point;
    parent?: string;
    components: readonly Components[];
    children?: ReplicatedEntityData[];
};

export type ReplicatedChunkData = {
    chunkX: number;
    chunkY: number;
    volume: string;
    terrain: readonly Terrain[];
};

export type GroundUpdate = {
    volumes: Volume[];
    chunks: ReplicatedChunkData[];
    discoveredTiles: Point[];
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
    ground: GroundUpdate;
    /** Server simulation tick at the time this snapshot was taken. Used by the client to sync its local tick. */
    serverTick: number;
    /** Snapshot of root-level components that are opted into replication (see replicatedRootComponents in replicatedEntitiesSystem). */
    replicatedRootComponents: Components[];
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

/**
 * Deletes a component from a replicated entity. Component presence is state
 * (an unmanned tower's searchlight emitter is removed rather than zeroed), so
 * removal must reach the client like any other mutation.
 */
export type RemoveComponentGameMessage = {
    type: typeof RemoveComponentGameMessageType;
    componentId: ComponentID;
    entity: string;
};

export type ComponentDeltaGameMessage = {
    type: typeof ComponentDeltaGameMessageType;
    entityId: string;
    componentId: ComponentID;
    operations: DeltaOperation[];
};

export type TransformGameMessage = {
    type: typeof TransformGameMessageType;
    entity: string;
    oldPosition: Point;
    position: Point;
};

export type GroundUpdateGameMessage = {
    type: typeof GroundUpdateGameMessageType;
    ground: GroundUpdate;
};

export type ReloadGameMessage = {
    type: typeof ReloadGameMessageType;
};

export type CommandGameMessage = {
    type: typeof CommandGameMessageType;
    command: GameCommand;
};
