import type { Point } from "../../common/point.js";
import type { BiomeType } from "./biome.js";

export type Volume = {
    size: number;
    maxSize: number;
    chunks: Point[];
    type: BiomeType;
    debugColor: string;
    id: string;
};
