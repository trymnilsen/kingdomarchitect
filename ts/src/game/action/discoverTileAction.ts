import type { WorldGenActionsId } from "./worldGenId.js";

export type DiscoverTileAction = {
    id: [typeof WorldGenActionsId, typeof DiscoverTileActionId];
};

export const DiscoverTileActionId = "discoverTile";
