import { Point } from "../../common/point.js";
import { zeroSides } from "../../common/sides.js";
import { UIRenderScope } from "../../rendering/uiRenderContext.js";
import { UILayoutScope } from "../uiLayoutContext.js";
import { fillUiSize, UISize, zeroSize } from "../uiSize.js";
import { UIView } from "../uiView.js";
import { UIViewGroup } from "../uiViewGroup.js";

/**
 * Represents a view that will attempt to layout children horizontally if there
 * is room, or vertically making the views fill the width if there is not enough
 * room
 */
export class UIStack extends UIViewGroup {
    override hitTest(_screenPoint: Point): boolean {
        return false;
    }

    override layout(layoutContext: UILayoutScope, constraints: UISize): UISize {
        if (this.children.length == 0) {
            this._measuredSize = zeroSize();
            return this._measuredSize;
        }

        const availableWidth = constraints.width / this.children.length;
        const itemConstraints = {
            width: availableWidth,
            height: constraints.height,
        };
        let isStackedHorizontally = true;
        let totalSize = zeroSize();
        for (const child of this.children) {
            const layoutResult = child.layout(layoutContext, constraints);
            totalSize.width += layoutResult.width;
            if (totalSize.height < layoutResult.height) {
                totalSize.height = layoutResult.height;
            }
        }

        //If the total size is larger than available size we will loop over the
        //children again. Setting the size to fill
        if (totalSize.width > constraints.width) {
            totalSize = zeroSize();
            for (const child of this.children) {
                child.size = { width: fillUiSize, height: child.size.height };
                const layoutResult = child.layout(layoutContext, constraints);
                totalSize.height += layoutResult.height;
                if (totalSize.width < layoutResult.width) {
                    totalSize.width = layoutResult.width;
                }
            }

            isStackedHorizontally = false;
        }

        let measuredSize = {
            width: totalSize.width,
            height: totalSize.height,
        };

        let currentOffset = 0;
        if (isStackedHorizontally) {
            const middleSpacing =
                (constraints.width - totalSize.width) /
                Math.max(1, this.children.length - 1);
            measuredSize.width = constraints.width;

            for (const child of this.children) {
                child.offset = {
                    x: currentOffset,
                    y: 0,
                };
                currentOffset += child.measuredSize.width + middleSpacing;
            }
        } else {
            const children = [...this.children].reverse();
            for (const child of children) {
                child.offset = {
                    x: 0,
                    y: currentOffset,
                };
                currentOffset += child.measuredSize.height;
            }
        }

        this._measuredSize = measuredSize;
        return measuredSize;
    }

    override draw(context: UIRenderScope): void {
        for (const child of this.children) {
            child.draw(context);
        }
    }
}
