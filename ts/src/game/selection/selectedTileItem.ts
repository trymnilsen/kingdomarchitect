import { Point } from "../../common/point.js";
import { GroundTile } from "../component/tile/tilesComponent.js";
import { SelectedWorldItem } from "./selectedWorldItem.js";

export class SelectedTileItem implements SelectedWorldItem {
    constructor(public groundTile: GroundTile) {}
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
    isSelectedItem(item: any): boolean {
        const xIsSame = this.groundTile.tileX === item.tileX;
        const yIsSame = this.groundTile.tileY === item.tileY;
        return xIsSame && yIsSame;
    }
}
