import { Point } from "../../../common/point.js";
import { BiomeType } from "../../map/biome/biome.js";

export interface Volume {
    size: number;
    maxSize: number;
    chunks: Point[];
    type: BiomeType;
    debugColor: string;
    id: string;
}
