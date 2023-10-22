import { Sprite2 } from "../asset/sprite.js";
import { TextStyle } from "../rendering/text/textStyle.js";
import { UISize } from "./uiSize.js";

export type UILayoutContext = {
    measureText(text: string, textStyle: TextStyle): UISize;
    measureSprite(sprite: Sprite2): UISize;
};
