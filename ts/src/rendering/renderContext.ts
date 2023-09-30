import { AssetLoader } from "../asset/loader/assetLoader.js";
import { Sprite2 } from "../asset/sprite.js";
import { UILayoutContext } from "../ui/uiLayoutContext.js";
import { UISize } from "../ui/uiSize.js";
import { Camera } from "./camera.js";
import {
    NinePatchSpriteConfiguration,
    ninePatchImageRenderer as ninePatchSpriteRenderer,
    SpriteConfiguration,
    spriteRenderer,
} from "./items/sprite.js";
import {
    RectangleConfiguration,
    rectangleRenderer,
} from "./items/rectangle.js";
import { TextConfiguration, textRenderer } from "./items/text.js";
import { TextStyle } from "./text/textStyle.js";
import { UIRenderContext } from "./uiRenderContext.js";
import { Bounds } from "../common/bounds.js";
import { sprites } from "../../generated/sprites.js";

export type DrawFunction = (context: RenderContext) => void;

/**
 * The rendercontext combines the access to the camera, assets and canvas
 * allowing drawing to the screen and convertion of tilespace to screenspace
 */
export class RenderContext implements UIRenderContext, UILayoutContext {
    private canvasContext: CanvasRenderingContext2D;
    private _camera: Camera;
    private _assetLoader: AssetLoader;
    private _deferredRenderCalls: DrawFunction[] = [];
    private _width: number;
    private _height: number;

    /**
     * The currently active camera for the render context
     */
    get camera(): Camera {
        return this._camera;
    }

    /**
     * The width of the canvas the context is drawing to
     */
    get width(): number {
        return this._width;
    }

    /**
     * The height of the canvas the context is drawing to
     */
    get height(): number {
        return this._height;
    }

    /**
     * The loader for assets like sprites and fonts
     */
    get assetLoader(): AssetLoader {
        return this._assetLoader;
    }

    constructor(
        canvasContext: CanvasRenderingContext2D,
        camera: Camera,
        assetLoader: AssetLoader,
        width: number,
        height: number,
    ) {
        this.canvasContext = canvasContext;
        this._camera = camera;
        this._assetLoader = assetLoader;
        this._width = width;
        this._height = height;
    }

    updateSize(width: number, height: number): void {
        this._width = width;
        this._height = height;
    }

    drawLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        width: number,
    ): void {
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(x1, y1);
        this.canvasContext.lineTo(x2, y2);
        this.canvasContext.lineWidth = width;
        this.canvasContext.strokeStyle = color;
        this.canvasContext.stroke();
    }

    getSprite(id: string): Sprite2 {
        return sprites[id];
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

    drawWithClip(bounds: Bounds, drawFunction: DrawFunction): void {
        try {
            this.canvasContext.save();
            this.canvasContext.beginPath();
            this.canvasContext.rect(
                bounds.x1,
                bounds.y1,
                bounds.x2 - bounds.x1,
                bounds.y2 - bounds.y1,
            );
            this.canvasContext.clip();
            drawFunction(this);
        } finally {
            this.canvasContext.restore();
        }
    }

    drawDeferred(drawFunction: DrawFunction): void {
        this._deferredRenderCalls.push(drawFunction);
    }

    getDeferredDrawFunctions(): readonly DrawFunction[] {
        return this._deferredRenderCalls;
    }

    clearDeferredDrawFunctions(): void {
        this._deferredRenderCalls = [];
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
        let frame = 0;
        if (sprite.targetWidth) {
            targetWidth = sprite.targetWidth;
        }
        if (sprite.targetHeight) {
            targetHeight = sprite.targetHeight;
        }
        if (sprite.frame) {
            frame = sprite.frame;
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
            frame,
            this._assetLoader.getBinAsset(sprite.sprite.bin),
            this.canvasContext,
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
            this.canvasContext,
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
