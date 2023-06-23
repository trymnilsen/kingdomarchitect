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
import { zeroPoint } from "../../common/point.js";
import { totalHorizontal, totalVertical, zeroSides } from "../../common/sides.js";
import { defaultTextStyle } from "../../rendering/text/textStyle.js";
import { calculateAlignment, uiAlignment } from "../uiAlignment.js";
import { fillUiSize, wrapUiSize } from "../uiSize.js";
import { UIView } from "../uiView.js";
export class UIText extends UIView {
    get padding() {
        return this._padding;
    }
    set padding(value) {
        this._padding = value;
    }
    get text() {
        return this._text;
    }
    set text(value) {
        this._text = value;
    }
    get textStyle() {
        return this._textStyle;
    }
    set textStyle(value) {
        this._textStyle = value;
    }
    get alignment() {
        return this._alignment;
    }
    set alignment(value) {
        this._alignment = value;
    }
    hitTest(screenPoint) {
        return this.withinViewBounds(screenPoint);
    }
    layout(layoutContext, constraints) {
        const textSize = layoutContext.measureText(this._text, this._textStyle);
        const measuredSize = {
            width: 0,
            height: 0
        };
        const horizontalPadding = totalHorizontal(this.padding);
        const verticalPadding = totalVertical(this.padding);
        // Set the measured size based on the wanted ui size
        if (this.size.width == wrapUiSize) {
            measuredSize.width = textSize.width + horizontalPadding;
        } else if (this.size.width == fillUiSize) {
            measuredSize.width = constraints.width;
        } else {
            measuredSize.width = this.size.width;
        }
        if (this.size.height == wrapUiSize) {
            measuredSize.height = textSize.height + verticalPadding;
        } else if (this.size.height == fillUiSize) {
            measuredSize.height = constraints.height;
        } else {
            measuredSize.height = this.size.height;
        }
        const calculatedAlignment = calculateAlignment(measuredSize.width, measuredSize.height, this._alignment, textSize.width + horizontalPadding, textSize.height + verticalPadding);
        this._textAlignmentOffset = calculatedAlignment;
        this._measuredSize = measuredSize;
        return measuredSize;
    }
    draw(context) {
        context.drawScreenspaceText({
            text: this._text,
            color: this._textStyle.color,
            x: this.screenPosition.x + this._textAlignmentOffset.x + this.padding.left,
            //TODO: The y position for offsets seems off?
            y: this.screenPosition.y + this._textAlignmentOffset.y + this.padding.top,
            font: this._textStyle.font,
            size: this._textStyle.size
        });
    }
    isInteractable() {
        return false;
    }
    constructor(...args){
        super(...args);
        _define_property(this, "_textStyle", defaultTextStyle);
        _define_property(this, "_text", "");
        _define_property(this, "_alignment", uiAlignment.center);
        _define_property(this, "_textAlignmentOffset", zeroPoint());
        _define_property(this, "_padding", zeroSides());
    }
}
