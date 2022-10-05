import { clamp } from "../../common/number";
import { addPoint, Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { uiAlignment } from "../uiAlignment";
import { UIBackground } from "../uiBackground";
import { fillUiSize, UISize, UIView, wrapUiSize } from "../uiView";

export class UIBox extends UIView {
    private _alignment: Point = uiAlignment.center;
    private _background: UIBackground | null = null;

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

    layout(constraints: UISize): UISize {
        let widthConstraint = 0;
        let widthSize = 0;
        let heightConstraint = 0;
        let heightSize = 0;

        let measuredWidth = 0;
        let measuredHeight = 0;
        // Set the constraints for children based on the size of this box
        if (this.size.width > 0) {
            widthConstraint = this.size.width;
        } else {
            widthConstraint = constraints.width;
        }

        if (this.size.height > 0) {
            heightConstraint = this.size.height;
        } else {
            heightConstraint = constraints.height;
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
            const childSize = child.layout({
                width: widthConstraint,
                height: heightConstraint,
            });
            // Update the size of this view if its set to wrap
            if (this.size.width == wrapUiSize) {
                if (
                    childSize.width > measuredWidth &&
                    childSize.width < constraints.width
                ) {
                    measuredWidth = childSize.width;
                }
            }

            if (this.size.height == wrapUiSize) {
                if (
                    childSize.height > measuredHeight &&
                    childSize.height < constraints.height
                ) {
                    measuredHeight = childSize.height;
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
            if (!child.measuredSize) {
                throw new Error("Child had no measured size");
            }

            const halfWidthConstraint = measuredWidth / 2;
            const halfHeightConstraint = measuredHeight / 2;

            const widthAlignment =
                halfWidthConstraint * this._alignment.x + halfWidthConstraint;
            const heightAlignment =
                halfHeightConstraint * this._alignment.y + halfHeightConstraint;
            const offsetX = widthAlignment - child.measuredSize.width / 2;
            const offsetY = heightAlignment - child.measuredSize.height / 2;
            const clampedOffsetX = clamp(
                offsetX,
                0,
                measuredWidth - child.measuredSize.width
            );
            const clampedOffsetY = clamp(
                offsetY,
                0,
                measuredHeight - child.measuredSize.height
            );

            child.offset = {
                x: clampedOffsetX,
                y: clampedOffsetY,
            };
        }
        this._isDirty = false;
        return measuredSize;
    }

    draw(context: UIRenderContext): void {
        if (this._background) {
            if (!this.measuredSize) {
                throw new Error("Size not measured, unable to draw");
            }
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
}
