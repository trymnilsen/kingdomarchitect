import type { Sprite2 } from "../asset/sprite.ts";
import type { Bounds } from "../common/bounds.ts";
import type { RectangleConfiguration } from "./items/rectangle.ts";
import type {
    NinePatchSpriteConfiguration,
    SpriteConfiguration,
} from "./items/sprite.ts";
import type { TextConfiguration } from "./items/text.ts";

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
