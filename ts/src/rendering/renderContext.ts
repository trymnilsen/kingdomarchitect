import { AssetLoader } from "../asset/loader/assetLoader";
import { Sprite2 } from "../asset/sprite";
import { UILayoutContext } from "../ui/uiLayoutContext";
import { UISize } from "../ui/uiSize";
import { Camera } from "./camera";
import {
    NinePatchSpriteConfiguration,
    ninePatchImageRenderer as ninePatchSpriteRenderer,
    SpriteConfiguration,
    spriteRenderer,
} from "./items/sprite";
import { RectangleConfiguration, rectangleRenderer } from "./items/rectangle";
import { TextConfiguration, textRenderer } from "./items/text";
import { TextStyle } from "./text/textStyle";
import { UIRenderContext } from "./uiRenderContext";
import { Bounds } from "../common/bounds";

/**
 * The rendercontext combines the access to the camera, assets and canvas
 * allowing drawing to the screen and convertion of tilespace to screenspace
 */
export class RenderContext implements UIRenderContext, UILayoutContext {
    private canvasContext: CanvasRenderingContext2D;
    private _camera: Camera;
    private _assetLoader: AssetLoader;
    private _width: number;
    private _height: number;

    /**
     * The currently active camera for the render context
     */
    public get camera(): Camera {
        return this._camera;
    }

    /**
     * The width of the canvas the context is drawing to
     */
    public get width(): number {
        return this._width;
    }

    /**
     * The height of the canvas the context is drawing to
     */
    public get height(): number {
        return this._height;
    }

    /**
     * The loader for assets like sprites and fonts
     */
    public get assetLoader(): AssetLoader {
        return this._assetLoader;
    }

    constructor(
        canvasContext: CanvasRenderingContext2D,
        camera: Camera,
        assetLoader: AssetLoader,
        width: number,
        height: number
    ) {
        this.canvasContext = canvasContext;
        this._camera = camera;
        this._assetLoader = assetLoader;
        this._width = width;
        this._height = height;
    }

    /**
     * Measures the size of the sprite
     * @param sprite the sprite to measure
     * @returns the width and height as a UISize
     */
    measureSprite(sprite: Sprite2): UISize {
        const width = sprite.defintion.w;
        const height = sprite.defintion.h;

        return {
            width,
            height,
        };
    }

    /**
     * Measures the size of the given string with the provided text style.
     * The text will be measured as if it had unlimited space
     * @param text the string to measure
     * @param textStyle the text style to measure
     * @return the measured size
     */
    measureText(text: string, textStyle: TextStyle): UISize {
        this.canvasContext.font = `${textStyle.size}px ${textStyle.font}`;
        const textMetrics = this.canvasContext.measureText(text);
        return {
            width: Math.ceil(textMetrics.width),
            height: Math.ceil(textMetrics.actualBoundingBoxDescent),
        };
    }

    drawWithClip(
        bounds: Bounds,
        drawFunction: (context: UIRenderContext) => void
    ): void {
        try {
            this.canvasContext.save();
            this.canvasContext.beginPath();
            this.canvasContext.rect(
                bounds.x1,
                bounds.y1,
                bounds.x2 - bounds.x1,
                bounds.y2 - bounds.y1
            );
            this.canvasContext.clip();
            drawFunction(this);
        } finally {
            this.canvasContext.restore();
        }
    }

    /**
     * Draw a rectangle on the canvas using coordinates in worldspace
     * @param rectangle the configuration for the rectangle
     */
    drawRectangle(rectangle: RectangleConfiguration) {
        const transformedX = this.camera.worldToScreenX(rectangle.x);
        const transformedY = this.camera.worldToScreenY(rectangle.y);
        rectangle.x = Math.floor(transformedX);
        rectangle.y = Math.floor(transformedY);
        rectangleRenderer(rectangle, this.canvasContext);
    }

    /**
     * Draw a rectangle on the canvas using coordinates in screenspace
     * @param rectangle the configuration for the rectangle
     */
    drawScreenSpaceRectangle(rectangle: RectangleConfiguration) {
        rectangleRenderer(rectangle, this.canvasContext);
    }

    /**
     * Draw a sprite on the canvas using coordinates in worldspace
     * @param sprite the sprite to draw
     */
    drawSprite(sprite: SpriteConfiguration) {
        const transformedX = this.camera.worldToScreenX(sprite.x);
        const transformedY = this.camera.worldToScreenY(sprite.y);
        const transformedConfiguration = Object.assign({}, sprite);
        transformedConfiguration.x = transformedX;
        transformedConfiguration.y = transformedY;
        this.drawScreenSpaceSprite(transformedConfiguration);
    }

    /**
     * Draw a sprite on the canvas using coordinates in screenspace with a
     * given scale
     * @param sprite the sprite to draw
     */
    drawScreenSpaceSprite(sprite: SpriteConfiguration) {
        const spriteBounds = sprite.sprite.defintion;
        let targetWidth = spriteBounds.w;
        let targetHeight = spriteBounds.h;
        if (!!sprite.targetWidth) {
            targetWidth = sprite.targetWidth;
        }
        if (!!sprite.targetHeight) {
            targetHeight = sprite.targetHeight;
        }
        spriteRenderer(
            sprite.x,
            sprite.y,
            spriteBounds.x,
            spriteBounds.y,
            spriteBounds.w,
            spriteBounds.h,
            targetWidth,
            targetHeight,
            this._assetLoader.getBinAsset(sprite.sprite.bin),
            this.canvasContext
        );
    }

    /**
     * Draws a scalable version of an image know as a nine patch or nice slice.
     * This is a bit expensive as it needs to draw 9 images to represent a
     * perceived single image so use it sparringly. Coordinates are provided in
     * screenspace.
     * @param ninePatch the configuration of the image to draw
     */
    drawNinePatchSprite(ninePatch: NinePatchSpriteConfiguration) {
        const spriteDefintion = ninePatch.sprite.defintion;
        ninePatchSpriteRenderer(
            ninePatch.x,
            ninePatch.y,
            spriteDefintion.x,
            spriteDefintion.y,
            spriteDefintion.w,
            spriteDefintion.h,
            ninePatch.width,
            ninePatch.height,
            ninePatch.sides.top,
            ninePatch.sides.bottom,
            ninePatch.sides.left,
            ninePatch.sides.right,
            ninePatch.scale,
            this._assetLoader.getBinAsset(ninePatch.sprite.bin),
            this.canvasContext
        );
    }

    /**
     * Draw text to the canvas using coordinates in worldspace
     */
    drawText(text: TextConfiguration) {
        textRenderer(text, this.canvasContext);
    }

    /**
     * Draw text to the canvas using coordinates in screenspace
     * TODO: This seems to be the same as `drawText`
     */
    drawScreenspaceText(text: TextConfiguration): void {
        textRenderer(text, this.canvasContext);
    }
}
