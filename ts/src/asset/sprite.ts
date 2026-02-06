import { spriteRefs as generatedSpriteRefs } from "../../generated/sprites.ts";

export type Sprite2Id = keyof typeof spriteRefs;

/**
 * Sprite definition as a compact tuple: [w, h, x, y] or [w, h, x, y, frames]
 * Use the SPRITE_* constants for indexed access.
 */
export type SpriteDefinition =
    | [number, number, number, number]
    | [number, number, number, number, number];

/** Index for sprite width in SpriteDefinition tuple */
export const SPRITE_W = 0;
/** Index for sprite height in SpriteDefinition tuple */
export const SPRITE_H = 1;
/** Index for sprite X position in SpriteDefinition tuple */
export const SPRITE_X = 2;
/** Index for sprite Y position in SpriteDefinition tuple */
export const SPRITE_Y = 3;
/** Index for sprite frame count in SpriteDefinition tuple (defaults to 1 if not present) */
export const SPRITE_FRAMES = 4;

/**
 * A serialization-safe sprite reference that only stores the bin and spriteId.
 * Use the SpriteRegistry to resolve this to a SpriteDefinition.
 */
export type SpriteRef = {
    bin: string;
    spriteId: string;
};

/**
 * Pre-created SpriteRef objects for all sprites.
 * Use these directly instead of calling spriteRefs.xxx.
 */
export const spriteRefs = generatedSpriteRefs as {
    [K in keyof typeof generatedSpriteRefs]: SpriteRef;
};

export const emptySpriteRef: SpriteRef = spriteRefs.empty_sprite;
