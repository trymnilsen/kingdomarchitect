import { type Point } from "../../common/point.ts";
import type { SpriteRef } from "../../asset/sprite.ts";

/**
 * Defines a currently applied tint to a sprite
 */
export type SpriteTint = {
    /**
     * The css string for the color to apply on a sprite
     */
    color: string;
    /**
     * For how long should this tint be applied. Only counts [DrawMode.Tick]
     * frames. Set to a negative number like -1 to keep it until its reset
     */
    frames: number;
};

export function constantTint(color: string): SpriteTint {
    return {
        color: color,
        frames: -1,
    };
}

export function damageTint(): SpriteTint {
    return {
        color: "white",
        frames: 1,
    };
}

export type SpriteComponent = {
    id: typeof SpriteComponentId;
    /**
     * Reference to the sprite to render. Use the SpriteRegistry to resolve
     * this to a SpriteDefinition at render time.
     */
    sprite: SpriteRef;
    frame: number;
    offset?: Point;
    size?: Point;
    tint?: SpriteTint;
    /**
     * Secondary sort key used when two entities share the same Y position.
     * Higher depth renders on top. Defaults to 0.
     */
    depth?: number;
};

/**
 * Creates a new sprite component
 * @param sprite the sprite reference
 * @param offset an optional offset
 * @param size an optional size
 * @param tint an optional tint
 * @returns the constructed SpriteComponent
 */
export function createSpriteComponent(
    sprite: SpriteRef,
    offset?: Point,
    size?: Point,
    tint?: SpriteTint,
    depth?: number,
): SpriteComponent {
    return {
        id: SpriteComponentId,
        frame: 0,
        sprite,
        offset,
        size,
        tint,
        depth,
    };
}

export const SpriteComponentId = "Sprite";
