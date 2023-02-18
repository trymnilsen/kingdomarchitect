import { UIViewProperties } from "./uiViewDsl";
import { UIImage } from "../view/uiImage";
import { UIImageSource, UISpriteImageSource } from "../view/uiImageSource";
import { Sprite2 } from "../../asset/sprite";

export interface UIImageProperties extends UIViewProperties {
    image: UIImageSource;
    scale?: number;
}

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
