import { Point } from "../../../common/point";
import { GroundTile } from "../component/tile/tilesComponent";
import { SelectedWorldItem } from "./selectedWorldItem";

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
        const treeIsSame = this.groundTile.hasTree === item.hasTree;
        return xIsSame && yIsSame && treeIsSame;
    }
}
