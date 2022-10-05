import { NinePatchImageConfiguration } from "./items/image";
import { RectangleConfiguration } from "./items/rectangle";

export interface UIRenderContext {
    drawNinePatchImage(image: NinePatchImageConfiguration): void;
    drawScreenSpaceRectangle(rectangle: RectangleConfiguration): void;
}
