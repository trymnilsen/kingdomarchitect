import { AssetLoader } from "../asset/assetLoader";
import { Camera } from "./camera";
import { ImageConfiguration, imageRenderer } from "./items/image";
import { RectangleConfiguration, rectangleRenderer } from "./items/rectangle";

export class RenderContext {
    private canvasContext: CanvasRenderingContext2D;
    private _camera: Camera;
    private assetLoader: AssetLoader;

    public get camera(): Camera {
        return this._camera;
    }

    constructor(
        canvasContext: CanvasRenderingContext2D,
        camera: Camera,
        assetLoader: AssetLoader
    ) {
        this.canvasContext = canvasContext;
        this._camera = camera;
        this.assetLoader = assetLoader;
    }
    drawRectangle(rectangle: RectangleConfiguration) {
        const transformedX = this.camera.worldToScreenX(rectangle.x);
        const transformedY = this.camera.worldToScreenY(rectangle.y);
        rectangle.x = transformedX;
        rectangle.y = transformedY;
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
}
