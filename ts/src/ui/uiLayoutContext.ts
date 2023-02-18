import { Sprite2 } from "../asset/sprite";
import { TextStyle } from "../rendering/text/textStyle";
import { UISize } from "./uiSize";

export interface UILayoutContext {
    measureText(text: string, textStyle: TextStyle): UISize;
    measureSprite(sprite: Sprite2): UISize;
}
