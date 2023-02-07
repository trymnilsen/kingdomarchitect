import { UIViewProperties } from "./uiViewDsl";
import { UIImage } from "../view/uiImage";
import {
    UIImageSource,
    UISpriteImageSource,
    UIAssetImageSource,
} from "../view/uiImageSource";
import { Sprite } from "../../asset/sprite";
import { ImageAsset } from "../../asset/assets";

export interface UIImageProperties extends UIViewProperties {
    image: UIImageSource;
    scale?: number;
}

export function spriteImageSource(sprite: Sprite): UIImageSource {
    return new UISpriteImageSource(sprite);
}

export function assetImageSource(asset: ImageAsset): UIImageSource {
    return new UIAssetImageSource(asset);
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
