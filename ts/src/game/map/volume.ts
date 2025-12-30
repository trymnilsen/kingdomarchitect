import type { Point } from "../../common/point.ts";
import type { BiomeType } from "./biome.ts";

export type Volume = {
    maxSize: number;
    chunks: Point[];
    type: BiomeType;
    debugColor: string;
    id: string;
    isStartBiome?: boolean;
};
