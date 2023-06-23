import { Point } from "../../common/point.js";
import { defaultTextStyle, TextStyle } from "../../rendering/text/textStyle.js";
import { UIRenderContext } from "../../rendering/uiRenderContext.js";
import { HorizontalAlignment } from "../uiAlignment.js";
import { UILayoutContext } from "../uiLayoutContext.js";
import { UISize } from "../uiSize.js";
import { UIView } from "../uiView.js";
import { UIImageSource } from "./uiImageSource.js";

export class UITextWithIcon extends UIView {
    private _textStyle: TextStyle = defaultTextStyle;
    private _text: string = "";
    /*     private _textAlignmentOffset: Point = zeroPoint();
    private _endIconDrawOffset: Point = zeroPoint(); */
    private _startImage: UIImageSource | null = null;
    private _endImage: UIImageSource | null = null;
    private _horizontalAlignment: HorizontalAlignment =
        HorizontalAlignment.Center;

    get text(): string {
        return this._text;
    }
    set text(value: string) {
        this._text = value;
    }

    get textStyle(): TextStyle {
        return this._textStyle;
    }
    set textStyle(value: TextStyle) {
        this._textStyle = value;
    }

    get startImage(): UIImageSource | null {
        return this._startImage;
    }
    set startImage(value: UIImageSource | null) {
        this._startImage = value;
    }

    get endImage(): UIImageSource | null {
        return this._endImage;
    }
    set endImage(value: UIImageSource | null) {
        this._endImage = value;
    }

    get horizontalAlignment(): HorizontalAlignment {
        return this._horizontalAlignment;
    }
    set horizontalAlignment(value: HorizontalAlignment) {
        this._horizontalAlignment = value;
    }

    hitTest(screenPoint: Point): boolean {
        return this.withinViewBounds(screenPoint);
    }

    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        throw new Error("Method not implemented");
    }
    draw(context: UIRenderContext): void {
        throw new Error("Method not implemented.");
    }

    isInteractable(): boolean {
        return false;
    }
}
