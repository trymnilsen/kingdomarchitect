import {
    ImageConfiguration,
    NinePatchImageConfiguration,
    SpriteConfiguration,
} from "./items/image";
import { RectangleConfiguration } from "./items/rectangle";
import { TextConfiguration } from "./items/text";

export interface UIRenderContext {
    drawScreenSpaceImage(image: ImageConfiguration, scale: number): void;
    drawScreenSpaceSprite(sprite: SpriteConfiguration): void;
    drawNinePatchImage(image: NinePatchImageConfiguration): void;
    drawScreenSpaceRectangle(rectangle: RectangleConfiguration): void;
    drawScreenspaceText(text: TextConfiguration): void;
    drawScreenSpaceImageInto(
        image: ImageConfiguration,
        targetWidth: number,
        targetHeight: number
    ): void;
}
