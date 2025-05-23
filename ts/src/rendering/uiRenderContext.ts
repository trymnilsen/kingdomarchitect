import { Sprite2 } from "../module/asset/sprite.js";
import { Bounds } from "../common/bounds.js";
import { RectangleConfiguration } from "./items/rectangle.js";
import {
    NinePatchSpriteConfiguration,
    SpriteConfiguration,
} from "./items/sprite.js";
import { TextConfiguration } from "./items/text.js";

export type UIRenderScope = {
    drawScreenSpaceSprite(sprite: SpriteConfiguration): void;
    drawNinePatchSprite(image: NinePatchSpriteConfiguration): void;
    drawScreenSpaceRectangle(rectangle: RectangleConfiguration): void;
    drawScreenspaceText(text: TextConfiguration): void;
    drawWithClip(
        bounds: Bounds,
        drawFunction: (context: UIRenderScope) => void,
    ): void;
    drawLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        width: number,
    ): void;
    getSprite(id: string): Sprite2 | undefined;
};
