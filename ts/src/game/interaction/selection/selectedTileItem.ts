import { Point } from "../../../common/point.js";
import { isTile, type GroundTile } from "../../map/tile.js";
import { SelectedWorldItem } from "./selectedWorldItem.js";

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
    isSelectedItem(item: unknown): boolean {
        if (!isTile(item)) {
            return false;
        }

        const xIsSame = this.groundTile.tileX === item.tileX;
        const yIsSame = this.groundTile.tileY === item.tileY;
        return xIsSame && yIsSame;
    }
}
