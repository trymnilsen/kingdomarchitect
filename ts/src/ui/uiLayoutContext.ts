import { assets, ImageAsset } from "../asset/assets";
import { Sprite } from "../asset/sprite";
import { TextStyle } from "../rendering/text/textStyle";
import { UISize } from "./uiView";

export interface UILayoutContext {
    measureText(text: string, textStyle: TextStyle): UISize;
    measureImage(asset: ImageAsset): UISize;
    measureSprite(sprite: Sprite): UISize;
}