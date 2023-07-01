import { addPoint, Point } from "../../common/point.js";
import {
    Sides,
    totalHorizontal,
    totalVertical,
    zeroSides,
} from "../../common/sides.js";
import { UIRenderContext } from "../../rendering/uiRenderContext.js";
import { calculateAlignment, uiAlignment } from "../uiAlignment.js";
import { UIBackground } from "../uiBackground.js";
import { UILayoutContext } from "../uiLayoutContext.js";
import { fillUiSize, UISize, wrapUiSize } from "../uiSize.js";
import { UIViewGroup } from "../uiViewGroup.js";

export class UIBox extends UIViewGroup {
    private _alignment: Point = uiAlignment.center;
    private _background: UIBackground | null = null;
    private _padding: Sides = zeroSides();

    get padding(): Sides {
        return this._padding;
    }
    set padding(value: Sides) {
        this._padding = value;
    }

    get alignment(): Point {
        return this._alignment;
    }
    set alignment(alignment: Point) {
        this._alignment = alignment;
    }

    get background(): UIBackground | null {
        return this._background;
    }
    set background(background: UIBackground | null) {
        this._background = background;
    }

    hitTest(screenPoint: Point): boolean {
        return !!this._background && this.withinViewBounds(screenPoint);
    }

    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        let widthConstraint = 0;
        let heightConstraint = 0;

        let measuredWidth = 0;
        let measuredHeight = 0;
        // Set the constraints for children based on the size of this box
        // subtract any padding
        const horizontalPadding = totalHorizontal(this.padding);
        const verticalPadding = totalVertical(this.padding);

        if (this.size.width > 0) {
            widthConstraint = this.size.width - horizontalPadding;
        } else {
            widthConstraint = constraints.width - horizontalPadding;
        }

        if (this.size.height > 0) {
            heightConstraint = this.size.height - verticalPadding;
        } else {
            heightConstraint = constraints.height - verticalPadding;
        }

        // Update the measured size if fill or fixed
        if (this.size.width > 0) {
            measuredWidth = this.size.width;
        } else if (this.size.width == fillUiSize) {
            measuredWidth = constraints.width;
        }

        if (this.size.height > 0) {
            measuredHeight = this.size.height;
        } else if (this.size.height == fillUiSize) {
            measuredHeight = constraints.height;
        }

        // layout the children
        for (const child of this.children) {
            const childSize = child.layout(layoutContext, {
                width: widthConstraint,
                height: heightConstraint,
            });
            // Update the size of this view if its set to wrap
            // Include the padding in the newly wrapped size
            const childWidthWithPadding = childSize.width + horizontalPadding;
            const childHeightWithPadding = childSize.height + verticalPadding;
            if (this.size.width == wrapUiSize) {
                if (
                    childWidthWithPadding > measuredWidth &&
                    childWidthWithPadding < constraints.width
                ) {
                    measuredWidth = childWidthWithPadding;
                }
            }

            if (this.size.height == wrapUiSize) {
                if (
                    childHeightWithPadding > measuredHeight &&
                    childHeightWithPadding < constraints.height
                ) {
                    measuredHeight = childHeightWithPadding;
                }
            }
        }

        const measuredSize: UISize = {
            width: measuredWidth,
            height: measuredHeight,
        };
        this._measuredSize = measuredSize;

        // Update the position of the children
        for (const child of this.children) {
            if (!child.isLayedOut) {
                throw new Error(
                    "Child had no measured size, make its layed out"
                );
            }

            const alignedPosition = calculateAlignment(
                measuredWidth - horizontalPadding,
                measuredHeight - verticalPadding,
                this._alignment,
                child.measuredSize.width,
                child.measuredSize.height
            );

            // set the offset of the child based on the alignment, offset
            // by the x1 and y1 padding
            child.offset = addPoint(alignedPosition, {
                x: this.padding.left,
                y: this.padding.top,
            });
        }
        //this._isDirty = false;
        return measuredSize;
    }

    draw(context: UIRenderContext): void {
        if (this._background && this.isLayedOut) {
            this._background.draw(
                context,
                this.screenPosition,
                this.measuredSize
            );
        }
        for (const child of this.children) {
            child.draw(context);
        }
    }

    isInteractable(): boolean {
        return this._background != null;
    }
}
