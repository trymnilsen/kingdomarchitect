import type { Volume } from "../../../game/map/volume.js";

export type DiscoverTileEffect = {
    id: typeof DiscoverTileEffectId;
    tiles: { x: number; y: number; volume: string }[];
    volumes?: Volume[];
};

export const DiscoverTileEffectId = "discoverTile";
