import { Bounds } from "../common/bounds.js";
import { RectangleConfiguration } from "./items/rectangle.js";
import {
    NinePatchSpriteConfiguration,
    SpriteConfiguration,
} from "./items/sprite.js";
import { TextConfiguration } from "./items/text.js";

export interface UIRenderContext {
    drawScreenSpaceSprite(sprite: SpriteConfiguration): void;
    drawNinePatchSprite(image: NinePatchSpriteConfiguration): void;
    drawScreenSpaceRectangle(rectangle: RectangleConfiguration): void;
    drawScreenspaceText(text: TextConfiguration): void;
    drawWithClip(
        bounds: Bounds,
        drawFunction: (context: UIRenderContext) => void
    ): void;
    drawLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        width: number
    ): void;
}
