import { Bounds } from "../../../../common/bounds";
import { GroundChunk, GroundTile } from "./tilesComponent";

export interface UnlockableArea {
    tiles: GroundTile[];
    chunks: GroundChunk[];
    bounds: Bounds;
    name: string;
    cost: number;
}
