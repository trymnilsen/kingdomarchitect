import type { Point } from "../../common/point.ts";
import type {
    ComponentID,
    Components,
} from "../../game/component/component.ts";
import type { Volume } from "../../game/map/volume.ts";
import type { DeltaOperation } from "../delta/deltaTypes.ts";
import type { GameCommand } from "./gameCommand.ts";
import type { DiscoveredTileData } from "./playerDiscoveryData.ts";

export type GameMessage =
    | WorldStateGameMessage
    | AddEntityGameMessage
    | RemoveEntityGameMessage
    | SetComponentGameMessage
    | ComponentDeltaGameMessage
    | TransformGameMessage
    | DiscoverTileGameMessage
    | ReloadGameMessage
    | CommandGameMessage;

export const WorldStateMessageType = "worldState";
export const AddEntityGameMessageType = "addEntity";
export const RemoveEntityGameMessageType = "removeEntity";
export const SetComponentGameMessageType = "setComponent";
export const ComponentDeltaGameMessageType = "componentDelta";
export const TransformGameMessageType = "transform";
export const DiscoverTileGameMessageType = "discoverTile";
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

/**
 * Replicates a full snapshot of the world for the intial state when loading
 * or creating a fresh new game
 */
export type WorldStateGameMessage = {
    type: typeof WorldStateMessageType;
    // The entities added to the root node, will visit children as well
    // so we should only add the first level
    rootChildren: ReplicatedEntityData[];
    // Tiles discovered by the player, includes volume reference
    discoveredTiles: DiscoveredTileData[];
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

export type DiscoverTileGameMessage = {
    type: typeof DiscoverTileGameMessageType;
    tiles: DiscoveredTileData[];
    volumes?: Volume[];
};

export type ReloadGameMessage = {
    type: typeof ReloadGameMessageType;
};

export type CommandGameMessage = {
    type: typeof CommandGameMessageType;
    command: GameCommand;
};
