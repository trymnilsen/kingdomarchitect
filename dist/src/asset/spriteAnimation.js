export function spriteFromAnimation(sprite, frame) {
    const clampedFrame = frame % sprite.frames;
    const frameWidth = sprite.defintion.w;
    return {
        bin: sprite.bin,
        defintion: {
            frames: 1,
            x: sprite.defintion.x + frameWidth * clampedFrame,
            y: sprite.defintion.y,
            w: sprite.defintion.w,
            h: sprite.defintion.h
        }
    };
}
