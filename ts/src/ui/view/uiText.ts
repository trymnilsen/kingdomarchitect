import { Point, zeroPoint } from "../../common/point";
import { defaultTextStyle, TextStyle } from "../../rendering/text/textStyle";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { calculateAlignment, uiAlignment } from "../uiAlignment";
import { UILayoutContext } from "../uiLayoutContext";
import { fillUiSize, UISize, UIView, wrapUiSize } from "../uiView";

export class UIText extends UIView {
    private _textStyle: TextStyle = defaultTextStyle;
    private _text: string = "";
    private _alignment: Point = uiAlignment.center;
    private _textAlignmentOffset: Point = zeroPoint();

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

    get alignment(): Point {
        return this._alignment;
    }
    set alignment(value: Point) {
        this._alignment = value;
    }

    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        const textSize = layoutContext.measureText(this._text, this._textStyle);
        let measuredSize = { width: 0, height: 0 };

        // Set the measured size based on the wanted ui size
        if (this.size.width == wrapUiSize) {
            measuredSize.width = textSize.width;
        } else if (this.size.width == fillUiSize) {
            measuredSize.width = constraints.width;
        } else {
            measuredSize.width = this.size.width;
        }

        if (this.size.height == wrapUiSize) {
            measuredSize.height = textSize.height;
        } else if (this.size.height == fillUiSize) {
            measuredSize.height = constraints.height;
        } else {
            measuredSize.height = this.size.height;
        }

        const calculatedAlignment = calculateAlignment(
            measuredSize.width,
            measuredSize.height,
            this._alignment,
            textSize.width,
            textSize.height
        );

        this._textAlignmentOffset = calculatedAlignment;
        this._measuredSize = measuredSize;
        return measuredSize;
    }

    draw(context: UIRenderContext): void {
        context.drawScreenspaceText({
            text: this._text,
            color: this._textStyle.color,
            x: this.screenPosition.x + this._textAlignmentOffset.x,
            //TODO: The y position for offsets seems off?
            y: this.screenPosition.y + this._textAlignmentOffset.y,
            font: this._textStyle.font,
            size: this._textStyle.size,
        });
    }
}
