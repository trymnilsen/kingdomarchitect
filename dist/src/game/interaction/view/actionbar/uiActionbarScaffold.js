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
import { sprites2 } from "../../../../asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { SpriteBackground } from "../../../../ui/uiBackground.js";
import { wrapUiSize } from "../../../../ui/uiSize.js";
import { UIView } from "../../../../ui/uiView.js";
import { UIColumn } from "../../../../ui/view/uiColumn.js";
import { UIActionbar, UIActionbarAlignment } from "./uiActionbar.js";
import { UIActionbarButton } from "./uiActionbarButton.js";
import { actionbarHeight, actionbarWidth } from "./uiActionbarConstants.js";
const background = new SpriteBackground(sprites2.stone_slate_background_2x);
export class UIActionbarScaffold extends UIView {
    get isExpanded() {
        return this._leftExpandedMenu.length > 0 || this._rightExpandedMenu.length > 0;
    }
    get sides() {
        return this._sides;
    }
    set sides(value) {
        this._sides = value;
    }
    setLeftMenu(items) {
        this._leftActionbar.updateItems(items);
    }
    setRightMenu(items) {
        this._rightActionbar.updateItems(items);
    }
    setLeftExpandedMenu(items, anchorIndex) {
        this._leftExpandedMenu = items;
        this._leftExpandedMenuIndex = anchorIndex;
        this.setExpandedMenu(this._leftExpandedMenuColumn, items);
    }
    setRightExpandedMenu(items, anchorIndex) {
        this._rightExpandedMenu = items;
        this._rightExpandedMenuIndex = anchorIndex;
        this.setExpandedMenu(this._rightExpandedMenuColumn, items);
    }
    resetExpandedMenu() {
        if (this._leftExpandedMenu.length > 0) {
            this._leftExpandedMenuColumn.clearViews();
            this._leftExpandedMenu = [];
            this._leftExpandedMenuIndex = 0;
        }
        if (this._rightExpandedMenu.length > 0) {
            this._rightExpandedMenuColumn.clearViews();
            this._rightExpandedMenu = [];
            this._rightExpandedMenuIndex = 0;
        }
    }
    hitTest(screenPoint) {
        return false;
    }
    layout(layoutContext, constraints) {
        //Measure the actionbars first
        //We start with the left actionbar as it should be collapsed last
        //if there is not enough space
        const horizontalPadding = this._sides.left + this._sides.right;
        const verticalPadding = this._sides.top + this._sides.bottom;
        const paddedConstraints = {
            width: constraints.width - horizontalPadding,
            height: constraints.height - verticalPadding
        };
        const actionbarConstraints = {
            //Reserve some width for the right actionbar.
            //We substract a value here to avoid the need to do a
            //layout pass again if there is not enough space
            width: paddedConstraints.width - 100,
            height: actionbarHeight
        };
        let leftLayout = {
            width: 0,
            height: 0
        };
        //Layout the left actionbar if it is defined
        leftLayout = this._leftActionbar.layout(layoutContext, actionbarConstraints);
        //Layout the right actionbar if it is defined
        const rightConstraints = {
            width: paddedConstraints.width - leftLayout.width,
            height: actionbarHeight
        };
        const rightActionbar = this._rightActionbar.layout(layoutContext, rightConstraints);
        //Now we can measure the content view
        const contentConstraints = {
            width: paddedConstraints.width,
            height: paddedConstraints.height - actionbarHeight
        };
        const contentSize = this.contentView.layout(layoutContext, contentConstraints);
        //Layout the expanded views
        if (this._leftExpandedMenuColumn) {
            const leftExpandedMenuSize = this._leftExpandedMenuColumn.layout(layoutContext, contentConstraints);
            this._leftExpandedMenuColumn.offset = {
                x: this._sides.left + this._leftExpandedMenuIndex * actionbarWidth,
                y: this._sides.top + contentSize.height - leftExpandedMenuSize.height
            };
        }
        if (this._rightExpandedMenuColumn) {
            const rightExpandedMenuSize = this._rightExpandedMenuColumn.layout(layoutContext, contentConstraints);
            this._rightExpandedMenuColumn.offset = {
                x: this._sides.right + contentSize.height - rightExpandedMenuSize.width - rightActionbar.width + this._rightExpandedMenuIndex * actionbarWidth,
                y: this._sides.top + contentSize.height - rightExpandedMenuSize.height
            };
        }
        //The measured size includes the padding, so we are just setting
        //the constraints we received here
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height
        };
        //Position the actionbars
        //The left actionbar is positioned at the bottom left
        //The right actionbar is positioned at the bottom right
        this._leftActionbar.offset = {
            x: this._sides.left,
            y: constraints.height - actionbarHeight - this._sides.bottom
        };
        const size = this._rightActionbar.measuredSize.width;
        this._rightActionbar.offset = {
            x: constraints.width - size - this._sides.right,
            y: constraints.height - actionbarHeight - this._sides.bottom
        };
        this.contentView.offset = {
            x: this._sides.left,
            y: this._sides.top
        };
        return this._measuredSize;
    }
    draw(context) {
        this.contentView.draw(context);
        if (this._leftActionbar.children.length > 0) {
            this._leftActionbar.draw(context);
        }
        if (this._rightActionbar.children.length > 0) {
            this._rightActionbar.draw(context);
        }
        if (this._leftExpandedMenu.length > 0) {
            this._leftExpandedMenuColumn.draw(context);
        }
        if (this._rightExpandedMenu.length > 0) {
            this._rightExpandedMenuColumn.draw(context);
        }
    }
    createActionbar(items, alignment) {
        return new UIActionbar(items, new SpriteBackground(sprites2.stone_slate_background_2x), alignment, {
            width: wrapUiSize,
            height: wrapUiSize
        });
    }
    setExpandedMenu(menu, items) {
        const buttons = items.map((item)=>{
            return new UIActionbarButton(item, background);
        });
        menu.clearViews();
        for (const button of buttons){
            menu.addView(button);
        }
    }
    constructor(contentView, leftItems, rightItems, size){
        super(size);
        _define_property(this, "contentView", void 0);
        _define_property(this, "leftItems", void 0);
        _define_property(this, "rightItems", void 0);
        _define_property(this, "_sides", void 0);
        _define_property(this, "_leftActionbar", void 0);
        _define_property(this, "_rightActionbar", void 0);
        _define_property(this, "_leftExpandedMenuIndex", void 0);
        _define_property(this, "_rightExpandedMenuIndex", void 0);
        _define_property(this, "_leftExpandedMenuColumn", void 0);
        _define_property(this, "_rightExpandedMenuColumn", void 0);
        _define_property(this, "_leftExpandedMenu", void 0);
        _define_property(this, "_rightExpandedMenu", void 0);
        this.contentView = contentView;
        this.leftItems = leftItems;
        this.rightItems = rightItems;
        this._sides = allSides(16);
        this._leftExpandedMenuIndex = 0;
        this._rightExpandedMenuIndex = 0;
        this._leftExpandedMenu = [];
        this._rightExpandedMenu = [];
        this.addView(contentView);
        const leftActionbar = this.createActionbar(leftItems, UIActionbarAlignment.Left);
        this._leftActionbar = leftActionbar;
        this.addView(leftActionbar);
        const rightActionbar = this.createActionbar(rightItems, UIActionbarAlignment.Right);
        this._rightActionbar = rightActionbar;
        this.addView(rightActionbar);
        const leftColumn = new UIColumn({
            width: wrapUiSize,
            height: wrapUiSize
        });
        const rightColumn = new UIColumn({
            width: wrapUiSize,
            height: wrapUiSize
        });
        this._leftExpandedMenuColumn = leftColumn;
        this._rightExpandedMenuColumn = rightColumn;
        this.addView(leftColumn);
        this.addView(rightColumn);
    }
}
