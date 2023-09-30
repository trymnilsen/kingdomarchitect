import { Sprite2 } from "./sprite.js";

export interface SpriteAnimation extends Sprite2 {
    frames: number;
}

export function spriteFromAnimation(
    sprite: SpriteAnimation,
    frame: number,
): Sprite2 {
    const clampedFrame = frame % sprite.frames;
    const frameWidth = sprite.defintion.w;
    return {
        bin: sprite.bin,
        id: sprite.id,
        defintion: {
            frames: 1,
            x: sprite.defintion.x + frameWidth * clampedFrame,
            y: sprite.defintion.y,
            w: sprite.defintion.w,
            h: sprite.defintion.h,
        },
    };
}
