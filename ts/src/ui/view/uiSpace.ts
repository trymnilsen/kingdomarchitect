import { Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize } from "../uiSize";
import { fillUiSize, UIView, wrapUiSize } from "../uiView";

export class UISpace extends UIView {
    constructor(size: UISize) {
        super(size);
        if (size.width == wrapUiSize) {
            console.warn("UISpace wraps nothing, width will be 0");
        }

        if (size.height == wrapUiSize) {
            console.warn("UISpace wraps nothing, height will be 0");
        }
    }

    hitTest(screenPoint: Point): boolean {
        return false;
    }
    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        let measuredWidth = 0;
        let measuredHeight = 0;

        if (this.size.width == fillUiSize) {
            measuredWidth = constraints.width;
        } else if (this.size.width > 0) {
            measuredWidth = this.size.width;
        }

        if (this.size.width == wrapUiSize) {
            measuredHeight = constraints.height;
        } else if (this.size.width > 0) {
            measuredHeight = this.size.height;
        }

        this._measuredSize = {
            width: measuredWidth,
            height: measuredHeight,
        };

        return this._measuredSize;
    }

    draw(context: UIRenderContext): void {
        // Nothing to draw here
    }
}
