import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize, UIView } from "../uiView";

class UIRow extends UIView {
    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        throw new Error("Method not implemented.");
    }
    draw(context: UIRenderContext): void {
        throw new Error("Method not implemented.");
    }
}
