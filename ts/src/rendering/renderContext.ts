import { assets } from "../asset/assets";
import { AssetLoader } from "../asset/loader/assetLoader";
import { Sprite } from "../asset/sprite";
import { UILayoutContext } from "../ui/uiLayoutContext";
import { UISize } from "../ui/uiSize";
import { Camera } from "./camera";
import {
    ImageConfiguration,
    imageRenderer,
    imageSizeRenderer,
    NinePatchImageConfiguration,
    ninePatchImageRenderer,
    SpriteConfiguration,
    spriteRenderer,
} from "./items/image";
import { RectangleConfiguration, rectangleRenderer } from "./items/rectangle";
import { TextConfiguration, textRenderer } from "./items/text";
import { TextStyle } from "./text/textStyle";
import { UIRenderContext } from "./uiRenderContext";

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

    public get camera(): Camera {
        return this._camera;
    }

    public get width(): number {
        return this._width;
    }

    public get height(): number {
        return this._height;
    }

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

    measureImage(asset: keyof typeof assets): UISize {
        const image = this._assetLoader.getAsset(asset);
        const width = image.width;
        const height = image.height;
        return {
            width,
            height,
        };
    }

    measureSprite(sprite: Sprite): UISize {
        const width = sprite.bounds.x2 - sprite.bounds.x1;
        const height = sprite.bounds.y2 - sprite.bounds.y1;

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

    /**
     * Draw a rectangle on the canvas using coordinates in tilespace
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
     * Draw an image on the canvas using coordinates in tilespace
     * @param image the image to draw
     */
    drawImage(image: ImageConfiguration) {
        const transformedX = this.camera.worldToScreenX(image.x);
        const transformedY = this.camera.worldToScreenY(image.y);
        imageRenderer(
            transformedX,
            transformedY,
            1,
            this._assetLoader.getAsset(image.image),
            this.canvasContext
        );
    }

    /**
     * Draw a sprite on the canvas using coordinates in tilespace
     * @param sprite the sprite to draw
     */
    drawSprite(sprite: SpriteConfiguration) {
        const transformedX = this.camera.worldToScreenX(sprite.x);
        const transformedY = this.camera.worldToScreenY(sprite.y);

        spriteRenderer(
            transformedX,
            transformedY,
            sprite.sprite.bounds,
            this._assetLoader.getAsset(sprite.sprite.asset),
            this.canvasContext
        );
    }

    /**
     * Draw an image on the canvas using coordinates in screenspace with a
     * given scale
     * @param image the image to draw
     * @param scale the scale to draw the image at. 1.0 is considered the normal
     * size
     */
    drawScreenSpaceImage(image: ImageConfiguration, scale: number) {
        imageRenderer(
            image.x,
            image.y,
            scale,
            this._assetLoader.getAsset(image.image),
            this.canvasContext
        );
    }

    drawScreenSpaceImageInto(
        image: ImageConfiguration,
        targetWidth: number,
        targetHeight: number
    ) {
        imageSizeRenderer(
            image.x,
            image.y,
            targetWidth,
            targetHeight,
            this._assetLoader.getAsset(image.image),
            this.canvasContext
        );
    }

    /**
     * Draw a sprite on the canvas using coordinates in screenspace with a
     * given scale
     * @param sprite the sprite to draw
     */
    drawScreenSpaceSprite(sprite: SpriteConfiguration) {
        spriteRenderer(
            sprite.x,
            sprite.y,
            sprite.sprite.bounds,
            this._assetLoader.getAsset(sprite.sprite.asset),
            this.canvasContext
        );
    }

    /**
     * Draws a scalable version of an image know as a nine patch or nice slice.
     * This is a bit expensive as it needs to draw 9 images to represent a
     * perceived single image so use it sparringly. Coordinates are provided in
     * screenspace.
     * @param image the configuration of the image to draw
     */
    drawNinePatchImage(image: NinePatchImageConfiguration) {
        ninePatchImageRenderer(
            image.x,
            image.y,
            image.width,
            image.height,
            image.sides.top,
            image.sides.bottom,
            image.sides.left,
            image.sides.right,
            image.scale,
            this._assetLoader.getAsset(image.asset),
            this.canvasContext
        );
    }

    /**
     *
     * @param text
     */
    drawText(text: TextConfiguration) {
        textRenderer(text, this.canvasContext);
    }

    drawScreenspaceText(text: TextConfiguration): void {
        textRenderer(text, this.canvasContext);
    }
}
