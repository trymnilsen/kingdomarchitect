import { UISize } from "../ui/uiSize";
import {
    NinePatchSpriteConfiguration,
    SpriteConfiguration,
} from "./items/sprite";
import { RectangleConfiguration } from "./items/rectangle";
import { TextConfiguration } from "./items/text";

export interface UIRenderContext {
    drawScreenSpaceSprite(sprite: SpriteConfiguration): void;
    drawNinePatchSprite(image: NinePatchSpriteConfiguration): void;
    drawScreenSpaceRectangle(rectangle: RectangleConfiguration): void;
    drawScreenspaceText(text: TextConfiguration): void;
}
