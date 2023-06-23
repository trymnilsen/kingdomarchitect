import { UIImage } from "../view/uiImage.js";
import { UISpriteImageSource } from "../view/uiImageSource.js";
export function spriteImageSource(sprite) {
    return new UISpriteImageSource(sprite);
}
export function uiImage(uiImageProperties) {
    const image = new UIImage({
        width: uiImageProperties.width,
        height: uiImageProperties.height
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
