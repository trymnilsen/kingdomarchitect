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
import { UIView } from "../uiView.js";
export class UIImage extends UIView {
    get image() {
        return this._image;
    }
    set image(value) {
        this._image = value;
    }
    get scale() {
        return this._scale;
    }
    set scale(value) {
        this._scale = value;
    }
    hitTest(screenPoint) {
        return this.withinViewBounds(screenPoint);
    }
    layout(layoutContext, constraints) {
        if (!this._image) {
            return constraints;
        }
        const imageSize = this._image.measure(layoutContext);
        imageSize.width = imageSize.width * this._scale;
        imageSize.height = imageSize.height * this._scale;
        const measuredSize = {
            width: 0,
            height: 0
        };
        // Set the measured size based on the wanted ui size
        if (this.size.width == wrapUiSize) {
            measuredSize.width = imageSize.width;
        } else if (this.size.width == fillUiSize) {
            measuredSize.width = constraints.width;
        } else {
            measuredSize.width = this.size.width;
        }
        if (this.size.height == wrapUiSize) {
            measuredSize.height = imageSize.height;
        } else if (this.size.height == fillUiSize) {
            measuredSize.height = constraints.height;
        } else {
            measuredSize.height = this.size.height;
        }
        this._measuredSize = measuredSize;
        const imageAspect = imageSize.width / imageSize.height;
        let imageDrawHeight = measuredSize.height;
        let imageDrawWidth = imageDrawHeight * imageAspect;
        // The aspect caused the width to overflow, try to fit it in the width
        // dimension instead
        if (imageDrawWidth > measuredSize.width) {
            imageDrawHeight = 1 / imageAspect * measuredSize.width;
            imageDrawWidth = measuredSize.width;
        }
        this._imageDrawSize = {
            width: Math.floor(imageDrawWidth),
            height: Math.floor(imageDrawHeight)
        };
        return measuredSize;
    }
    draw(context) {
        this._image?.draw(context, this.screenPosition, this._imageDrawSize);
    }
    isInteractable() {
        return false;
    }
    constructor(...args){
        super(...args);
        _define_property(this, "_image", null);
        _define_property(this, "_imageDrawSize", {
            width: 0,
            height: 0
        });
        _define_property(this, "_scale", 1);
    }
}
