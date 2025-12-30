import { Point } from "../../common/point.js";
import { TileSize } from "../../game/map/tile.js";
import { RenderScope } from "../renderScope.js";
import { RenderVisual } from "../renderVisual.js";

export class RoadVisual implements RenderVisual {
    private position: Point;

    constructor(position: Point) {
        this.position = position;
    }

    onDraw(context: RenderScope): void {
        context.drawRectangle({
            x: this.position.x * TileSize + 10,
            y: this.position.y * TileSize + 10,
            width: 16,
            height: 16,
            fill: "#7d3c04",
        });
    }
}
