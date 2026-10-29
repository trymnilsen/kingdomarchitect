import { pointEquals, type Point } from "../../../common/point.ts";
import { type GroundTile } from "../../map/tile.ts";
import { type SelectedWorldItem } from "./selectedWorldItem.ts";

export class SelectedTileItem implements SelectedWorldItem {
    public groundTile: GroundTile;

    constructor(groundTile: GroundTile) {
        this.groundTile = groundTile;
    }

    get tilePosition(): Point {
        return {
            x: this.groundTile.tileX,
            y: this.groundTile.tileY,
        };
    }
    get selectionSize(): Point {
        return {
            x: 1,
            y: 1,
        };
    }
    isSameItem(other: SelectedWorldItem): boolean {
        return (
            other instanceof SelectedTileItem &&
            pointEquals(other.tilePosition, this.tilePosition)
        );
    }
}
