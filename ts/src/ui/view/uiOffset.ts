import { addPoint, Point, zeroPoint } from "../../common/point";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize } from "../uiSize";
import { UIBox } from "./uiBox";

/**
 * A special extension of the UIBox view that allows to shift the child views
 * by a given amount after layout has been performed. Useful for overlapping
 * or moving children outside the bounds of the parent
 */
export class UIOffset extends UIBox {
    private _layoutOffset: Point = zeroPoint();

    get layoutOffset(): Point {
        return this._layoutOffset;
    }

    set layoutOffset(offset: Point) {
        this._layoutOffset = offset;
    }

    override layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize {
        const size = super.layout(layoutContext, constraints);
        // Loop over all the children and add any layout offset to the offset
        // of the child
        for (const child of this.children) {
            child.offset = addPoint(child.offset, this._layoutOffset);
        }

        return size;
    }

    override withinViewBounds(point: Point): boolean {
        return true;
    }
}
