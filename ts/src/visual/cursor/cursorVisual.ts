import { Point } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";

export function cursorVisual(position: Point, context: RenderContext) {
    context.drawImage({
        image: "cursor",
        x: position.x - 1,
        y: position.y - 1,
    });
}
