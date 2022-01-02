import { Camera } from "./camera";
import { RectangleConfiguration, rectangleRenderer } from "./items/rectangle";

export class RenderContext {
    private canvasContext: CanvasRenderingContext2D;
    private camera: Camera;
    constructor(canvasContext: CanvasRenderingContext2D, camera: Camera) {
        this.canvasContext = canvasContext;
        this.camera = camera;
    }
    drawRectangle(rectangle: RectangleConfiguration) {
        const transformedX = this.camera.worldToScreenX(rectangle.x);
        const transformedY = this.camera.worldToScreenY(rectangle.y);
        rectangle.x = transformedX;
        rectangle.y = transformedY;
        rectangleRenderer(rectangle, this.canvasContext);
    }
}
