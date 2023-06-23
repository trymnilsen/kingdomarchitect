import { Point } from "../../common/point.js";
import { UIRenderContext } from "../../rendering/uiRenderContext.js";
import { UILayoutContext } from "../uiLayoutContext.js";
import { UISize, fillUiSize, wrapUiSize } from "../uiSize.js";
import { UIView } from "../uiView.js";
import { UIImageSource } from "./uiImageSource.js";

export class UIImage extends UIView {
    private _image: UIImageSource | null = null;
    private _imageDrawSize: UISize = { width: 0, height: 0 };
    private _scale: number = 1;

    get image(): UIImageSource | null {
        return this._image;
    }

    set image(value: UIImageSource | null) {
        this._image = value;
    }

    get scale(): number {
        return this._scale;
    }

    set scale(value: number) {
        this._scale = value;
    }

    hitTest(screenPoint: Point): boolean {
        return this.withinViewBounds(screenPoint);
    }

    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        if (!this._image) {
            return constraints;
        }

        const imageSize: UISize = this._image.measure(layoutContext);
        imageSize.width = imageSize.width * this._scale;
        imageSize.height = imageSize.height * this._scale;

        const measuredSize = { width: 0, height: 0 };

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
            imageDrawHeight = (1 / imageAspect) * measuredSize.width;
            imageDrawWidth = measuredSize.width;
        }

        this._imageDrawSize = {
            width: Math.floor(imageDrawWidth),
            height: Math.floor(imageDrawHeight),
        };

        return measuredSize;
    }
    draw(context: UIRenderContext): void {
        this._image?.draw(context, this.screenPosition, this._imageDrawSize);
    }
    isInteractable(): boolean {
        return false;
    }
}
