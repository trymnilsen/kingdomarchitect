import { Point, addPoint, zeroPoint } from "../../common/point";
import { titleTextStyle } from "../../rendering/text/textStyle";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { bookInkColor } from "../color";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize } from "../uiSize";
import { UIBox } from "./uiBox";

export class UIBorderTitle extends UIBox {
    private _title: string = "";
    private _titleWidth: number = 0;

    private topLeft: Point = zeroPoint();
    private topRight: Point = zeroPoint();
    private bottomLeft: Point = zeroPoint();
    private bottomRight: Point = zeroPoint();

    get title(): string {
        return this._title;
    }
    set title(value: string) {
        this._title = value;
    }

    override hitTest(screenPoint: Point): boolean {
        throw new Error("Method not implemented.");
    }

    override layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize {
        const titleSize = layoutContext.measureText(
            this._title,
            titleTextStyle
        );
        this._titleWidth = titleSize.width;

        //Subtract the size for the border and the title
        //from the constraints as a new constant provided to the super class
        const newConstraints: UISize = {
            width: constraints.width - 32, // 32 = 2 sides * 16
            height: constraints.height - (64 + titleSize.height),
        };

        const boxSize = super.layout(layoutContext, newConstraints);

        this.topLeft = {
            x: 16,
            y: 16,
        };

        this.topRight = {
            x: boxSize.width - 16,
            y: 16,
        };

        this.bottomLeft = {
            x: 16,
            y: boxSize.height - 16,
        };

        this.bottomRight = {
            x: boxSize.width - 16,
            y: boxSize.height - 16,
        };

        return boxSize;
    }

    override draw(context: UIRenderContext): void {
        super.draw(context);
        if (!this._measuredSize) {
            throw new Error("UIBorderTitle must be measured before drawing");
        }

        const screenTopLeft = addPoint(this.screenPosition, this.topLeft);
        const screenTopRight = addPoint(this.screenPosition, this.topRight);
        const screenBottomLeft = addPoint(this.screenPosition, this.bottomLeft);
        const screenBottomRight = addPoint(
            this.screenPosition,
            this.bottomRight
        );

        //draw the top lef to bottom left line
        context.drawLine(
            screenTopLeft.x,
            screenTopLeft.y,
            screenBottomLeft.x,
            screenBottomLeft.y,
            bookInkColor,
            2
        );

        //Draw the top right to bottom right line
        context.drawLine(
            screenTopRight.x,
            screenTopRight.y,
            screenBottomRight.x,
            screenBottomRight.y,
            bookInkColor,
            2
        );

        //Draw the bottom left to bottom right line
        context.drawLine(
            screenBottomLeft.x,
            screenBottomLeft.y,
            screenBottomRight.x,
            screenBottomRight.y,
            bookInkColor,
            2
        );

        if (this._title != "") {
            context.drawScreenspaceText({
                text: this._title,
                color: bookInkColor,
                x:
                    this.screenPosition.x +
                    this._measuredSize.width / 2 -
                    this._titleWidth / 2,
                y: this.screenPosition.y + 16,
                font: titleTextStyle.font,
                size: titleTextStyle.size,
            });
        }
    }
}
