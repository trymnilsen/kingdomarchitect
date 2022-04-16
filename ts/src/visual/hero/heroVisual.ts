import { Point } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";

export function heroVisual(renderContext: RenderContext, position: Point) {
    renderContext.drawRectangle({
        x: position.x,
        y: position.y,
        width: 18,
        height: 18,
        fill: "#8506b8",
        strokeColor: "#44045e",
        strokeWidth: 2,
    });
}
