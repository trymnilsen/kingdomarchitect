import { Point } from "../../common/point.js";
import { UIRenderContext } from "../../rendering/uiRenderContext.js";
import { UILayoutContext } from "../uiLayoutContext.js";
import { UISize } from "../uiSize.js";
import { UIView } from "../uiView.js";

export class UIPaginatedList extends UIView {
    hitTest(screenPoint: Point): boolean {
        throw new Error("Method not implemented.");
    }
    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        throw new Error("Method not implemented.");
    }
    draw(context: UIRenderContext): void {
        throw new Error("Method not implemented.");
    }
}
