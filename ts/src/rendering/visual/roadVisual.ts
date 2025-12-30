import { Point } from "../../common/point.ts";
import { TileSize } from "../../game/map/tile.ts";
import { RenderScope } from "../renderScope.ts";
import { RenderVisual } from "../renderVisual.ts";

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
