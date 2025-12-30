import { Sprite2 } from "../asset/sprite.ts";
import { TextStyle } from "../rendering/text/textStyle.ts";
import { UISize } from "./uiSize.ts";

export type UILayoutScope = {
    measureText(text: string, textStyle: TextStyle): UISize;
    measureSprite(sprite: Sprite2): UISize;
};
