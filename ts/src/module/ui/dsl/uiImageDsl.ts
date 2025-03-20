import { UIViewProperties } from "./uiViewDsl.js";
import { UIImage } from "../view/uiImage.js";
import { UIImageSource, UISpriteImageSource } from "../view/uiImageSource.js";
import { Sprite2 } from "../../asset/sprite.js";

export type UIImageProperties = {
    image: UIImageSource;
    scale?: number;
} & UIViewProperties;

export function spriteImageSource(sprite: Sprite2): UIImageSource {
    return new UISpriteImageSource(sprite);
}

export function uiImage(uiImageProperties: UIImageProperties): UIImage {
    const image = new UIImage({
        width: uiImageProperties.width,
        height: uiImageProperties.height,
    });

    if (uiImageProperties.scale) {
        image.scale = uiImageProperties.scale;
    }

    if (uiImageProperties.id) {
        image.id = uiImageProperties.id;
    }

    image.image = uiImageProperties.image;

    return image;
}
