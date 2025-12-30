import { Point } from "../common/point.ts";
import { UIRenderScope } from "./uiRenderContext.ts";

export interface SizedDrawMethod {
    draw(
        context: UIRenderScope,
        screenposition: Point,
        size: { width: number; height: number },
    ): void;
}
