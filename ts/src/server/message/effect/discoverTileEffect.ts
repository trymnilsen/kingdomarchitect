import type { Volume } from "../../../game/map/volume.js";

export type DiscoverTileEffect = {
    id: typeof discoverTileEffectId;
    tiles: { x: number; y: number; volume: string }[];
    volumes?: Volume[];
};

export const discoverTileEffectId = "discoverTile";
