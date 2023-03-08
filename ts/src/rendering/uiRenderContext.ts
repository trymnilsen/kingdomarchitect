import { Bounds } from "../common/bounds";
import { RectangleConfiguration } from "./items/rectangle";
import {
    NinePatchSpriteConfiguration,
    SpriteConfiguration,
} from "./items/sprite";
import { TextConfiguration } from "./items/text";

export interface UIRenderContext {
    drawScreenSpaceSprite(sprite: SpriteConfiguration): void;
    drawNinePatchSprite(image: NinePatchSpriteConfiguration): void;
    drawScreenSpaceRectangle(rectangle: RectangleConfiguration): void;
    drawScreenspaceText(text: TextConfiguration): void;
    drawWithClip(
        bounds: Bounds,
        drawFunction: (context: UIRenderContext) => void
    ): void;
}
