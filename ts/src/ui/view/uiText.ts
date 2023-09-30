import { Point, zeroPoint } from "../../common/point.js";
import {
    Sides,
    totalHorizontal,
    totalVertical,
    zeroSides,
} from "../../common/sides.js";
import { defaultTextStyle, TextStyle } from "../../rendering/text/textStyle.js";
import { UIRenderContext } from "../../rendering/uiRenderContext.js";
import { calculateAlignment, uiAlignment } from "../uiAlignment.js";
import { UILayoutContext } from "../uiLayoutContext.js";
import {
    fillUiSize,
    UISize,
    UISizeEquals,
    wrapUiSize,
    zeroSize,
} from "../uiSize.js";
import { UIView } from "../uiView.js";

export class UIText extends UIView {
    private _textStyle: TextStyle = defaultTextStyle;
    private _text: string = "";
    private _alignment: Point = uiAlignment.center;
    private _textAlignmentOffset: Point = zeroPoint();
    private _padding: Sides = zeroSides();
    private _previousConstraints: UISize = zeroSize();
    private _textRuns: string[] = [];
    private _wrapText: boolean = false;
    private _lineHeight = 0;

    get padding(): Sides {
        return this._padding;
    }
    set padding(value: Sides) {
        this._padding = value;
    }

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

    get wrapText(): boolean {
        return this._wrapText;
    }
    set wrapText(value: boolean) {
        this._wrapText = value;
    }

    hitTest(screenPoint: Point): boolean {
        return this.withinViewBounds(screenPoint);
    }

    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        // Calculating the text runs can be expensive so if the constraints
        // or the text has changed we return early
        if (
            UISizeEquals(this._previousConstraints, constraints) &&
            !this.isDirty &&
            this._measuredSize
        ) {
            return this._measuredSize;
        }

        this._previousConstraints = constraints;

        const textSize = layoutContext.measureText(this._text, this._textStyle);
        if (textSize.width <= constraints.width) {
            return this.layoutSingleRunText(textSize, constraints);
        } else {
            // We need to layout the text over multiple lines
            return this.layoutMultiRunText(constraints, layoutContext);
        }
    }

    draw(context: UIRenderContext): void {
        for (let i = 0; i < this._textRuns.length; i++) {
            const run = this._textRuns[i];
            context.drawScreenspaceText({
                text: run,
                color: this._textStyle.color,
                x:
                    this.screenPosition.x +
                    this._textAlignmentOffset.x +
                    this.padding.left,
                //TODO: The y position for offsets seems off?
                y:
                    this.screenPosition.y +
                    this._textAlignmentOffset.y +
                    this.padding.top +
                    i * this._lineHeight,
                font: this._textStyle.font,
                size: this._textStyle.size,
            });
        }
    }

    isInteractable(): boolean {
        return false;
    }

    private layoutSingleRunText(textSize: UISize, constraints: UISize): UISize {
        const measuredSize = { width: 0, height: 0 };
        const horizontalPadding = totalHorizontal(this.padding);
        const verticalPadding = totalVertical(this.padding);
        // Set the measured size based on the wanted ui size
        if (this.size.width == wrapUiSize) {
            measuredSize.width = textSize.width + horizontalPadding;
        } else if (this.size.width == fillUiSize) {
            measuredSize.width = constraints.width;
        } else {
            measuredSize.width = this.size.width;
        }

        if (this.size.height == wrapUiSize) {
            measuredSize.height = textSize.height + verticalPadding;
        } else if (this.size.height == fillUiSize) {
            measuredSize.height = constraints.height;
        } else {
            measuredSize.height = this.size.height;
        }

        const calculatedAlignment = calculateAlignment(
            measuredSize.width,
            measuredSize.height,
            this._alignment,
            textSize.width + horizontalPadding,
            textSize.height + verticalPadding,
        );

        this._textAlignmentOffset = calculatedAlignment;
        this._measuredSize = measuredSize;
        this._textRuns = [this._text];
        return measuredSize;
    }

    private layoutMultiRunText(
        constraints: UISize,
        layoutContext: UILayoutContext,
    ): UISize {
        const horizontalPadding = totalHorizontal(this.padding);
        const verticalPadding = totalVertical(this.padding);
        const paddedConstraints: UISize = {
            width: Math.max(0, constraints.width - horizontalPadding),
            height: Math.max(0, constraints.height - verticalPadding),
        };
        //Split words on space and newline
        const words = this.text.split(" ").flatMap((word) => word.split("\n"));
        const textRuns: string[] = [];
        const spaceWidth = layoutContext.measureText(
            " ",
            this._textStyle,
        ).width;

        let currentRun = "";
        let currentLength = 0;
        let measuredHeight = 0;
        let measuredWidth = 0;

        function pushNewline() {
            textRuns.push(currentRun);
            currentLength = 0;
            currentRun = "";
        }

        for (const word of words) {
            if (word === "\n") {
                pushNewline();
            }

            const wordSize = layoutContext.measureText(word, this._textStyle);

            if (wordSize.height > this._lineHeight) {
                this._lineHeight = wordSize.height;
                measuredHeight += wordSize.height;
            }

            if (currentLength > measuredWidth) {
                measuredWidth = currentLength;
            }

            if (currentLength + wordSize.width > paddedConstraints.width) {
                pushNewline();
            }

            if (currentRun != "") {
                currentRun += " ";
                currentLength += spaceWidth;
            }

            currentLength += wordSize.width;
            currentRun += word;
        }

        this._textRuns = textRuns;
        this._measuredSize = {
            width: measuredWidth,
            height: measuredHeight,
        };

        return this._measuredSize;
    }
}
