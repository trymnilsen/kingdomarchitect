function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { fillUiSize, wrapUiSize } from "../uiSize.js";
import { UIViewGroup } from "../uiViewGroup.js";
export class UIFlowGrid extends UIViewGroup {
    get gridItemSize() {
        return this._gridItemMinimumSize;
    }
    set gridItemSize(uiSize) {
        this._gridItemMinimumSize = uiSize;
    }
    get gridPadding() {
        return this._gridPadding;
    }
    set gridPadding(value) {
        this._gridPadding = value;
    }
    hitTest(screenPoint) {
        //This layout itself is not interactable, only its children
        return false;
    }
    layout(layoutContext, constraints) {
        if (constraints.width < this._gridItemMinimumSize || constraints.height < this._gridItemMinimumSize) {
            throw new Error("Grid size larger than parent");
        }
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
        const totalRowHeight = numberOfRows * this.gridItemSize;
        const gridItemSizeWithPadding = this.gridItemSize - this._gridPadding * 2;
        const totalColumnWidth = numberOfColumns * this.gridItemSize;
        const columnAlignmentOffset = (constraints.width - totalColumnWidth) / 2;
        // if the wanted size is wrap set the height to the height of our rows
        if (this.size.height == wrapUiSize) {
            measuredHeight = totalRowHeight;
        }
        //Luckily we can layout and position the children in one iteration as
        //their size is know
        for(let index = 0; index < this.children.length; index++){
            const child = this.children[index];
            child.layout(layoutContext, {
                width: gridItemSizeWithPadding,
                height: gridItemSizeWithPadding
            });
            const x = index % numberOfColumns * this.gridItemSize + this._gridPadding + columnAlignmentOffset;
            const y = Math.floor(index / numberOfColumns) * this.gridItemSize + this._gridPadding;
            child.offset = {
                x,
                y
            };
        }
        const measuredSize = {
            width: measuredWidth,
            height: measuredHeight
        };
        this._measuredSize = measuredSize;
        return measuredSize;
    }
    draw(context) {
        for (const child of this.children){
            child.draw(context);
        }
    }
    constructor(size){
        super(size);
        _define_property(this, "_gridItemMinimumSize", 32);
        _define_property(this, "_gridPadding", 4);
        if (size.width == wrapUiSize) {
            throw new Error("Cannot wrap size in width axis");
        }
    }
}
