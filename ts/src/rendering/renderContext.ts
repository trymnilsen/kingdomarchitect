import { AssetLoader } from "../asset/assetLoader";
import { Camera } from "./camera";
import {
    ImageConfiguration,
    imageRenderer,
    NinePatchImageConfiguration,
    ninePatchImageRenderer,
} from "./items/image";
import { RectangleConfiguration, rectangleRenderer } from "./items/rectangle";

export class RenderContext {
    private canvasContext: CanvasRenderingContext2D;
    private _camera: Camera;
    private assetLoader: AssetLoader;
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

    constructor(
        canvasContext: CanvasRenderingContext2D,
        camera: Camera,
        assetLoader: AssetLoader,
        width: number,
        height: number
    ) {
        this.canvasContext = canvasContext;
        this._camera = camera;
        this.assetLoader = assetLoader;
        this._width = width;
        this._height = height;
    }
    drawRectangle(rectangle: RectangleConfiguration) {
        const transformedX = this.camera.worldToScreenX(rectangle.x);
        const transformedY = this.camera.worldToScreenY(rectangle.y);
        rectangle.x = transformedX;
        rectangle.y = transformedY;
        rectangleRenderer(rectangle, this.canvasContext);
    }

    drawScreenSpaceRectangle(rectangle: RectangleConfiguration) {
        rectangleRenderer(rectangle, this.canvasContext);
    }

    drawImage(image: ImageConfiguration) {
        const transformedX = this.camera.worldToScreenX(image.x);
        const transformedY = this.camera.worldToScreenY(image.y);
        imageRenderer(
            transformedX,
            transformedY,
            this.assetLoader.getAsset(image.image),
            this.canvasContext
        );
    }

    drawScreenSpaceImage(image: ImageConfiguration) {
        imageRenderer(
            image.x,
            image.y,
            this.assetLoader.getAsset(image.image),
            this.canvasContext
        );
    }

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
            this.assetLoader.getAsset(image.asset),
            this.canvasContext
        );
    }
}
