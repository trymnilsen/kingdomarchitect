import { Point } from "../common/point.js";
import { UIRenderScope } from "./uiRenderContext.js";

export interface SizedDrawMethod {
    draw(
        context: UIRenderScope,
        screenposition: Point,
        size: { width: number; height: number },
    ): void;
}
