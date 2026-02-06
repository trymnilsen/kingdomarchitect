import { AssetLoader } from "../asset/loader/assetLoader.ts";
import {
    type SpriteDefinition,
    SPRITE_W,
    SPRITE_H,
    SPRITE_X,
    SPRITE_Y,
} from "../asset/sprite.ts";
import { spriteRegistry } from "../asset/spriteRegistry.ts";
import type { UILayoutScope } from "../ui/uiLayoutContext.ts";
import type { UISize } from "../ui/uiSize.ts";
import { Camera } from "./camera.ts";
import {
    type NinePatchSpriteConfiguration,
    type SpriteConfiguration,
    ninePatchImageRenderer as ninePatchSpriteRenderer,
    spriteRenderer,
} from "./items/sprite.ts";
import {
    type RectangleConfiguration,
    rectangleRenderer,
} from "./items/rectangle.ts";
import { type TextConfiguration, textRenderer } from "./items/text.ts";
import type { TextStyle } from "./text/textStyle.ts";
import type { UIRenderScope } from "./uiRenderContext.ts";
import type { Bounds } from "../common/bounds.ts";
import { spriteRefs } from "../../generated/sprites.ts";
import type { CanvasContext } from "./canvasContext.ts";
import { BitmapCache } from "./bitmapCache.ts";
import { type Point, zeroPoint } from "../common/point.ts";

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
    private bitmapCache: BitmapCache;
    private _camera: Camera;
    private _assetLoader: AssetLoader;
    private _deferredRenderCalls: DrawFunction[] = [];
    private _size: UISize;

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
        return this._size.width;
    }

    /**
     * The height of the canvas the context is drawing to
     */
    get height(): number {
        return this._size.height;
    }

    get size(): UISize {
        return this._size;
    }

    /**
     * The loader for assets like sprites and fonts
     */
    get assetLoader(): AssetLoader {
        return this._assetLoader;
    }

    private textMeasureCache: Map<string, UISize> = new Map();

    constructor(
        canvasContext: CanvasContext,
        camera: Camera,
        assetLoader: AssetLoader,
        spriteCache: BitmapCache,
        width: number,
        height: number,
    ) {
        this.bitmapCache = spriteCache;
        this.canvasContext = canvasContext;
        this._camera = camera;
        this._assetLoader = assetLoader;
        this._size = { width, height };
    }

    updateSize(width: number, height: number): void {
        this._size = { width, height };
    }

    drawDottedLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        width: number,
    ): void {
        this.canvasContext.setLineDash([10, 10]);
        this.drawLine(x1, y1, x2, y2, color, width);
        this.canvasContext.setLineDash([]);
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

    getSprite(id: string): SpriteDefinition | undefined {
        const ref = spriteRefs[id as keyof typeof spriteRefs];
        if (!ref) return undefined;
        return spriteRegistry.resolve(ref);
    }

    getOffscreenRenderScope(
        width: number,
        height: number,
    ): OffscreenRenderScope {
        const offscreenCanvas = new OffscreenCanvas(width, height);
        const context = offscreenCanvas.getContext("2d", {
            willReadFrequently: true,
        });
        if (!context) {
            throw new Error("Cannot get 2d offscreen canvas");
        }

        context.imageSmoothingEnabled = false;
        return new OffscreenRenderScope(
            offscreenCanvas,
            context,
            new Camera(zeroPoint()),
            this._assetLoader,
            this.bitmapCache,
            width,
            height,
        );
    }

    /**
     * Measures the size of the sprite
     * @param sprite the sprite definition to measure
     * @returns the width and height as a UISize
     */
    measureSprite(sprite: SpriteDefinition): UISize {
        return {
            width: sprite[SPRITE_W],
            height: sprite[SPRITE_H],
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
        const font = `${textStyle.size}px ${textStyle.font}`;
        this.canvasContext.font = font;
        const cacheKey = text + font;
        const cachedSize = this.textMeasureCache.get(cacheKey);
        if (!!cachedSize) {
            return cachedSize;
        } else {
            const textMetrics = this.canvasContext.measureText(text);
            const size = {
                width: Math.ceil(textMetrics.width),
                height: Math.floor(
                    textMetrics.fontBoundingBoxAscent +
                        textMetrics.fontBoundingBoxDescent,
                ),
            };
            this.textMeasureCache.set(cacheKey, size);
            return size;
        }
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
     * given scale. SpriteRefs are resolved via the SpriteRegistry.
     * @param sprite the sprite to draw
     */
    drawScreenSpaceSprite(sprite: SpriteConfiguration) {
        const spriteDef = spriteRegistry.resolve(sprite.sprite);
        if (!spriteDef) {
            return;
        }
        let targetWidth = spriteDef[SPRITE_W];
        let targetHeight = spriteDef[SPRITE_H];
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
            let cachedBitmap = this.bitmapCache.getSprite(sprite);
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
                    spriteDef[SPRITE_X],
                    spriteDef[SPRITE_Y],
                    spriteDef[SPRITE_W],
                    spriteDef[SPRITE_H],
                    targetWidth,
                    targetHeight,
                    frame,
                    this._assetLoader.getBinAsset(sprite.sprite.bin),
                    context,
                );

                const bitmap = offscreenCanvas.transferToImageBitmap();
                this.bitmapCache.setSprite(bitmap, sprite);
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
                spriteDef[SPRITE_X],
                spriteDef[SPRITE_Y],
                spriteDef[SPRITE_W],
                spriteDef[SPRITE_H],
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
     * screenspace. SpriteRefs are resolved via the SpriteRegistry.
     * @param ninePatch the configuration of the image to draw
     */
    drawNinePatchSprite(ninePatch: NinePatchSpriteConfiguration) {
        const spriteDef = spriteRegistry.resolve(ninePatch.sprite);
        if (!spriteDef) {
            return;
        }
        ninePatchSpriteRenderer(
            ninePatch.x,
            ninePatch.y,
            spriteDef[SPRITE_X],
            spriteDef[SPRITE_Y],
            spriteDef[SPRITE_W],
            spriteDef[SPRITE_H],
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

export type OffscreenCanvasFactory = RenderScope["getOffscreenRenderScope"];
export class OffscreenRenderScope extends RenderScope {
    private canvas: OffscreenCanvas;
    private context: CanvasContext;
    constructor(
        canvas: OffscreenCanvas,
        context: CanvasContext,
        camera: Camera,
        assetLoader: AssetLoader,
        spriteCache: BitmapCache,
        width: number,
        height: number,
    ) {
        super(context, camera, assetLoader, spriteCache, width, height);
        this.canvas = canvas;
        this.context = context;
    }

    getBitmap(): ImageBitmap {
        return this.canvas.transferToImageBitmap();
    }

    /**
     * Extract pixel data from the canvas for a specific region
     * @param x The X position to start reading from
     * @param y The Y position to start reading from
     * @param width The width of the region to read
     * @param height The height of the region to read
     * @returns Set of pixel coordinates as "x,y" strings and the maximum Y value
     */
    extractPixels(
        x: number,
        y: number,
        width: number,
        height: number,
    ): { pixelSet: Set<string>; maxY: number } {
        const pixelSet = new Set<string>();
        let maxY = -Infinity;

        // Read pixel data from the canvas for the specified region
        const imageData = this.context.getImageData(x, y, width, height);

        // Iterate through the image data to find non-transparent pixels
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const pixelIndex = (py * width + px) * 4;
                const alpha = imageData.data[pixelIndex + 3];

                // If pixel has any opacity, consider it part of the rendered content
                if (alpha > 0) {
                    pixelSet.add(`${px},${py}`);
                    maxY = Math.max(maxY, py);
                }
            }
        }

        return { pixelSet, maxY };
    }
}
