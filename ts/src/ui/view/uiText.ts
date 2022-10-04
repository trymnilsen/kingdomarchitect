import { Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UISize, UIView } from "../uiView";

export class UIText extends UIView {
    layout(constraints: UISize): UISize {
        throw new Error("Method not implemented.");
    }
    draw(context: UIRenderContext): void {
        throw new Error("Method not implemented.");
    }
}
