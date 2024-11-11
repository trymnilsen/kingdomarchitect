import { AssetLoader } from "../asset/loader/assetLoader.js";
import { Sprite2 } from "../asset/sprite.js";
import { UILayoutScope } from "../ui/uiLayoutContext.js";
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
import { UIRenderScope } from "./uiRenderContext.js";
import { Bounds } from "../common/bounds.js";
import { sprites } from "../../generated/sprites.js";
import { CanvasContext } from "./canvasContext.js";
import { SpriteCache } from "./spriteCache.js";
import { Point } from "../common/point.js";

export type DrawFunction = (context: RenderScope) => void;

// renderer -> creates render context -> holds camera, canvas context for main and offscreen -> creates scope
// scope for offscreen and scope for main. Scope is passed to draw function and entities ++
// scope has reference to context for creating new scope on offscreen tint call. Scope holds ref to deferred calls
// rename render context to scope, create new context class

/**
 * The rendercontext combines the access to the camera, assets and canvas
 * allowing drawing to the screen and convertion of tilespace to screenspace
 */
export class RenderScope implements UIRenderScope, UILayoutScope {
    private canvasContext: CanvasContext;
    private spriteCache: SpriteCache;
    private _camera: Camera;
    private _assetLoader: AssetLoader;
    private _deferredRenderCalls: DrawFunction[] = [];
    private _width: number;
    private _height: number;
    private _offscreenCanvas: OffscreenCanvas;
    private _offscreenContext: CanvasContext;

    drawTick: number = 0;
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
        spriteCache: SpriteCache,
        width: number,
        height: number,
    ) {
        this.spriteCache = spriteCache;
        this.canvasContext = canvasContext;
        this._camera = camera;
        this._assetLoader = assetLoader;
        this._width = width;
        this._height = height;
        this._offscreenCanvas = new OffscreenCanvas(this.width, this.height);
        const context = this._offscreenCanvas.getContext("2d");
        if (!context) {
            throw new Error("Unable to get offscreen canvas");
        }
        this._offscreenContext = context;
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

    getSprite(id: string): Sprite2 | undefined {
        return sprites[id] as Sprite2;
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
            height: Math.ceil(textMetrics.fontBoundingBoxDescent),
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

        if (!!sprite.tint) {
            // If we are tinting the sprite we first need to draw it to an
            // offscreen canvas. We can use compositing to change the color
            // and then save it as an image. This image will be used with the
            // sprite renderer method rather than the "raw" sprite
            let cachedBitmap = this.spriteCache.getSprite(sprite);
            if (!cachedBitmap) {
                const offscreenCanvas = new OffscreenCanvas(
                    targetWidth,
                    targetHeight,
                );

                const context = offscreenCanvas.getContext("2d");

                if (!context) {
                    console.error("No context available, cannot tint");
                    return;
                }
                context.imageSmoothingEnabled = false;

                context.fillStyle = sprite.tint;
                context.fillRect(0, 0, targetWidth, targetHeight);
                context.globalCompositeOperation = "destination-in";
                spriteRenderer(
                    0,
                    0,
                    spriteBounds.x,
                    spriteBounds.y,
                    spriteBounds.w,
                    spriteBounds.h,
                    targetWidth,
                    targetHeight,
                    frame,
                    this._assetLoader.getBinAsset(sprite.sprite.bin),
                    context,
                );

                const bitmap = offscreenCanvas.transferToImageBitmap();
                this.spriteCache.setSprite(bitmap, sprite);
                cachedBitmap = bitmap;
            }

            spriteRenderer(
                sprite.x,
                sprite.y,
                0,
                0,
                targetWidth,
                targetHeight,
                targetWidth,
                targetHeight,
                frame,
                cachedBitmap,
                this.canvasContext,
            );
        } else {
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

    drawTextWithStyle(text: string, point: Point, style: TextStyle) {
        textRenderer(
            {
                text: text,
                x: point.x,
                y: point.y,
                font: style.font,
                color: style.color,
                size: style.size,
            },
            this.canvasContext,
        );
    }

    /**
     * Draw text to the canvas using coordinates in screenspace
     */
    drawScreenspaceText(text: TextConfiguration): void {
        this.drawText(text);
    }
}
