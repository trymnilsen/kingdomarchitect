import {
    type SpriteDefinition,
    SPRITE_W,
    SPRITE_H,
    SPRITE_X,
    SPRITE_Y,
    SPRITE_FRAMES,
} from "./sprite.ts";

/**
 * Get the sprite definition for a specific frame of an animated sprite.
 * Adjusts the X position based on the frame index.
 */
export function getSpriteFrame(
    sprite: SpriteDefinition,
    frame: number,
): SpriteDefinition {
    const frameCount = sprite[SPRITE_FRAMES] ?? 1;
    const clampedFrame = frame % frameCount;
    const frameWidth = sprite[SPRITE_W];

    return [
        sprite[SPRITE_W],
        sprite[SPRITE_H],
        sprite[SPRITE_X] + frameWidth * clampedFrame,
        sprite[SPRITE_Y],
    ];
}
