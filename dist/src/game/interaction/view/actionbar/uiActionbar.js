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
import { UIView } from "../../../../ui/uiView.js";
import { UIActionbarButton } from "./uiActionbarButton.js";
export var UIActionbarAlignment;
(function(UIActionbarAlignment) {
    UIActionbarAlignment[UIActionbarAlignment["Left"] = 0] = "Left";
    UIActionbarAlignment[UIActionbarAlignment["Right"] = 1] = "Right";
})(UIActionbarAlignment || (UIActionbarAlignment = {}));
export class UIActionbar extends UIView {
    updateItems(items) {
        this.clearViews();
        this.items = items;
        const views = this.items.map((item)=>{
            return new UIActionbarButton(item, this.background);
        });
        //Add the views as children
        for (const view of views){
            this.addView(view);
        }
    }
    hitTest(screenPoint) {
        return false;
    }
    layout(layoutContext, constraints) {
        let usedWidth = 0;
        for (const child of this.children){
            const constraint = {
                width: constraints.width / this.children.length,
                height: constraints.height
            };
            const childSize = child.layout(layoutContext, constraint);
            child.offset = {
                x: usedWidth,
                y: 0
            };
            usedWidth += childSize.width;
        }
        this._measuredSize = {
            width: usedWidth,
            height: constraints.height
        };
        return this._measuredSize;
    }
    draw(context) {
        for (const child of this.children){
            child.draw(context);
        }
    }
    constructor(items, background, aligment, size){
        super(size);
        _define_property(this, "items", void 0);
        _define_property(this, "background", void 0);
        _define_property(this, "aligment", void 0);
        this.items = items;
        this.background = background;
        this.aligment = aligment;
        this.updateItems(items);
    }
}
