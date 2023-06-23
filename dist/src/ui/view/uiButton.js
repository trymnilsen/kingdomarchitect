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
import { withinRectangle } from "../../common/bounds.js";
import { UIBox } from "./uiBox.js";
export class UIButton extends UIBox {
    get onTappedBackground() {
        return this._onTappedBackground;
    }
    set onTappedBackground(background) {
        this._onTappedBackground = background;
    }
    get defaultBackground() {
        return this._defaultBackground;
    }
    set defaultBackground(background) {
        if (this.background == null) {
            this.background = background;
        }
        this._defaultBackground = background;
    }
    get isFocusable() {
        return true;
    }
    onTapDown(screenPoint) {
        if (this._onTappedBackground) {
            this.background = this._onTappedBackground;
        }
        return true;
    }
    onTap(screenPoint) {
        if (this.onTapCallback) {
            try {
                this.onTapCallback();
            } catch (err) {
                console.error("Failed invoking on tap:", err);
            }
        }
        return true;
    }
    onTapUp(screenPoint) {
        console.log("Button: reset background due to tapUp");
        this.background = this._defaultBackground;
    }
    hitTest(screenPoint) {
        return withinRectangle(screenPoint, this.screenPosition.x, this.screenPosition.y, this.screenPosition.x + this.measuredSize.width, this.screenPosition.y + this.measuredSize.height);
    }
    constructor(...args){
        super(...args);
        _define_property(this, "_onTappedBackground", null);
        _define_property(this, "_defaultBackground", null);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        _define_property(this, "onTapCallback", ()=>{});
    }
}
