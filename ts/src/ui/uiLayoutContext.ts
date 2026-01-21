import type { Sprite2 } from "../asset/sprite.ts";
import type { TextStyle } from "../rendering/text/textStyle.ts";
import type { UISize } from "./uiSize.ts";

export type UILayoutScope = {
    measureText(text: string, textStyle: TextStyle): UISize;
    measureSprite(sprite: Sprite2): UISize;
};
