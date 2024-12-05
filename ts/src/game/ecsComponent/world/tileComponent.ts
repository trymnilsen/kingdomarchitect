import { Point } from "../../../common/point.js";
import { BiomeType } from "../../map/biome/biome.js";

export type TileEntry = {
    x: number;
    y: number;
    type: BiomeType;
};

export class TileComponent {
    tiles: Record<string, TileEntry> = {};
}

export function tileId(x: number, y: number) {
    return x + ":" + y;
}
