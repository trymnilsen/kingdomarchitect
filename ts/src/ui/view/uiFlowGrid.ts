import { Point } from "../../common/point";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UILayoutContext } from "../uiLayoutContext";
import { UISize, zeroSize } from "../uiSize";
import { fillUiSize, UIView, wrapUiSize } from "../uiView";

export class UIFlowGrid extends UIView {
    private _gridItemMinimumSize: number = 32;
    private _gridPadding: number = 4;

    constructor(size: UISize) {
        super(size);
        if (size.width == wrapUiSize) {
            throw new Error("Cannot wrap size in width axis");
        }
    }

    get gridItemSize(): number {
        return this._gridItemMinimumSize;
    }
    set gridItemSize(uiSize: number) {
        this._gridItemMinimumSize = uiSize;
    }

    get gridPadding(): number {
        return this._gridPadding;
    }
    set gridPadding(value: number) {
        this._gridPadding = value;
    }

    hitTest(screenPoint: Point): boolean {
        //This layout itself is not interactable, only its children
        return false;
    }
    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        if (
            constraints.width < this._gridItemMinimumSize ||
            constraints.height < this._gridItemMinimumSize
        ) {
            throw new Error("Grid size larger than parent");
        }

        let widthConstraint = 0;
        let heightConstraint = 0;

        let measuredWidth = 0;
        let measuredHeight = 0;

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
        //Calculate how many we fit in the width axis
        const numberOfColumns = Math.floor(measuredWidth / this.gridItemSize);
        const numberOfRows = Math.ceil(this.children.length / numberOfColumns);
        const rowHeight = numberOfRows * this.gridItemSize;
        const gridItemSizeWithPadding =
            this.gridItemSize - this._gridPadding * 2;
        //Luckily we can layout and position the children in one iteration as
        //their size is know
        for (let index = 0; index < this.children.length; index++) {
            const child = this.children[index];
            child.layout(layoutContext, {
                width: gridItemSizeWithPadding,
                height: gridItemSizeWithPadding,
            });

            const x =
                (index % numberOfColumns) * this.gridItemSize +
                this._gridPadding;
            const y =
                Math.floor(index / numberOfColumns) * this.gridItemSize +
                this._gridPadding;

            child.offset = {
                x,
                y,
            };
        }

        const measuredSize: UISize = {
            width: measuredWidth,
            height: rowHeight,
        };

        this._measuredSize = measuredSize;
        return measuredSize;
    }
    draw(context: UIRenderContext): void {
        for (const child of this.children) {
            child.draw(context);
        }
    }
}
