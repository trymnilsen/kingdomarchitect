import { Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize } from "../uiSize";
import { UIView } from "../uiView";

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
