import { Sprite } from "./sprite";

export interface SpriteAnimation extends Sprite {
    frames: number;
}

export function spriteFromAnimation(
    sprite: SpriteAnimation,
    frame: number
): Sprite {
    const clampedFrame = frame % sprite.frames;
    const frameWidth = sprite.bounds.x2 - sprite.bounds.x1;
    return {
        asset: sprite.asset,
        bounds: {
            x1: sprite.bounds.x1 + clampedFrame * frameWidth,
            x2: sprite.bounds.x1 + (clampedFrame + 1) * frameWidth,
            y1: sprite.bounds.y1,
            y2: sprite.bounds.y2,
        },
    };
}
