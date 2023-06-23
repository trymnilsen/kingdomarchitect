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
import { defaultTextStyle } from "../../rendering/text/textStyle.js";
import { HorizontalAlignment } from "../uiAlignment.js";
import { UIView } from "../uiView.js";
export class UITextWithIcon extends UIView {
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
    get startImage() {
        return this._startImage;
    }
    set startImage(value) {
        this._startImage = value;
    }
    get endImage() {
        return this._endImage;
    }
    set endImage(value) {
        this._endImage = value;
    }
    get horizontalAlignment() {
        return this._horizontalAlignment;
    }
    set horizontalAlignment(value) {
        this._horizontalAlignment = value;
    }
    hitTest(screenPoint) {
        return this.withinViewBounds(screenPoint);
    }
    layout(layoutContext, constraints) {
        throw new Error("Method not implemented");
    }
    draw(context) {
        throw new Error("Method not implemented.");
    }
    isInteractable() {
        return false;
    }
    constructor(...args){
        super(...args);
        _define_property(this, "_textStyle", defaultTextStyle);
        _define_property(this, "_text", "");
        /*     private _textAlignmentOffset: Point = zeroPoint();
    private _endIconDrawOffset: Point = zeroPoint(); */ _define_property(this, "_startImage", null);
        _define_property(this, "_endImage", null);
        _define_property(this, "_horizontalAlignment", HorizontalAlignment.Center);
    }
}
