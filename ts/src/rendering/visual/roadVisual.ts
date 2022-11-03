import { Point } from "../../common/point";
import { TileSize } from "../../game/entity/tile";
import { RenderContext } from "../renderContext";
import { RenderVisual } from "../renderVisual";

export class RoadVisual implements RenderVisual {
    constructor(private position: Point) {}
    onDraw(context: RenderContext): void {
        context.drawRectangle({
            x: this.position.x * TileSize + 10,
            y: this.position.y * TileSize + 10,
            width: 16,
            height: 16,
            fill: "#7d3c04",
        });
    }
}
