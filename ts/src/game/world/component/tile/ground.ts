import { Point } from "../../../../common/point";
import { GroundTile } from "./tilesComponent";

export interface Ground {
    getTile(tilePosition: Point): GroundTile | null;
    getTiles(predicate: (tile: GroundTile) => boolean): GroundTile[];
    setTile(tile: GroundTile);
}
