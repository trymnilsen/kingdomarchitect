import { Point } from "../../../../common/point.js";
import { GroundTile } from "./tilesComponent.js";

export interface Ground {
    getTile(tilePosition: Point): GroundTile | null;
    getTiles(predicate: (tile: GroundTile) => boolean): GroundTile[];
    setTile(tile: GroundTile);
}
