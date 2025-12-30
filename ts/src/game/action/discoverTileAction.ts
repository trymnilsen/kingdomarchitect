import type { WorldGenActionsId } from "./worldGenId.ts";

export type DiscoverTileAction = {
    id: [typeof WorldGenActionsId, typeof DiscoverTileActionId];
};

export const DiscoverTileActionId = "discoverTile";
