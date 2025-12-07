import { SpriteConfiguration } from "./items/sprite.js";

export class BitmapCache {
    private entries: { [id: string]: ImageBitmap } = {};
    getSprite(sprite: SpriteConfiguration): ImageBitmap | null {
        const cacheKey = makeCacheKey(sprite);
        return this.entries[cacheKey] || null;
    }
    setSprite(image: ImageBitmap, sprite: SpriteConfiguration): void {
        const cacheKey = makeCacheKey(sprite);
        this.entries[cacheKey] = image;
    }
}

function makeCacheKey(sprite: SpriteConfiguration): string {
    let key = sprite.sprite.id;
    if (sprite.frame) {
        key += ":" + sprite.frame;
    }

    if (sprite.tint) {
        key += ":" + sprite.tint;
    }

    return key;
}
