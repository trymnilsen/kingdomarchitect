import { Point, addPoint, zeroPoint } from "../../../common/point";
import { titleTextStyle } from "../../../rendering/text/textStyle";
import { UIRenderContext } from "../../../rendering/uiRenderContext";
import { bookInkColor } from "../../../ui/color";
import { UILayoutContext } from "../../../ui/uiLayoutContext";
import { UISize } from "../../../ui/uiSize";
import { UIBox } from "./../../../ui/view/uiBox";

export class UIBorderTitle extends UIBox {
    private _title: string = "";
    private _titleWidth: number = 0;

    private topLinePoint: number = 0;
    private topLineLeft: number = 0;
    private topLineRight: number = 0;

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
        const topPadding = 32 + titleSize.height;
        const horizontalPadding = 16;
        const bottomPadding = 32;

        this.padding = {
            top: topPadding,
            left: horizontalPadding,
            right: horizontalPadding,
            bottom: bottomPadding,
        };

        const boxSize = super.layout(layoutContext, constraints);

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
            y: boxSize.height - 32,
        };

        this.bottomRight = {
            x: boxSize.width - 16,
            y: boxSize.height - 32,
        };

        this.topLinePoint = this.topLeft.y + titleSize.height / 2;
        const topWidth = boxSize.width - horizontalPadding * 2;
        const halfTitleWidth = this._titleWidth / 2;
        const halfTopWidth = topWidth / 2;
        this.topLineLeft = this.topLeft.x + halfTopWidth - halfTitleWidth - 16;
        this.topLineRight =
            this.topRight.x - halfTopWidth + halfTitleWidth + 16;
        return boxSize;
    }

    override draw(context: UIRenderContext): void {
        super.draw(context);
        if (!this._measuredSize) {
            throw new Error("UIBorderTitle must be measured before drawing");
        }
        const screenTopPointLeft = this.screenPosition.x + this.topLineLeft;
        const screenTopPointRight = this.screenPosition.x + this.topLineRight;
        const screenTopPoint = this.screenPosition.y + this.topLinePoint;
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
            screenTopPoint,
            screenBottomLeft.x,
            screenBottomLeft.y,
            bookInkColor,
            2
        );

        //Draw the top right to bottom right line
        context.drawLine(
            screenTopRight.x,
            screenTopPoint,
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

        //Draw the line from screen top left to screen top point left
        context.drawLine(
            screenTopLeft.x,
            screenTopPoint,
            screenTopPointLeft,
            screenTopPoint,
            bookInkColor,
            2
        );
        //Draw the line from screen top right to screen top point right
        context.drawLine(
            screenTopRight.x,
            screenTopPoint,
            screenTopPointRight,
            screenTopPoint,
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
