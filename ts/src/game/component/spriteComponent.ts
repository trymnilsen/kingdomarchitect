import { type Point } from "../../common/point.js";
import { type Sprite2 } from "../../asset/sprite.js";
import type { AnimationGraph } from "../../rendering/animation/animationGraph.js";

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
    sprite: Sprite2;
    frame: number;
    offset?: Point;
    size?: Point;
    tint?: SpriteTint;
};

/**
 * Creates a new sprite component
 * @param sprite the sprite to use
 * @param offset an optional offset
 * @param size an optional size
 * @param tint an optional tint
 * @returns the constructed SpriteComponent
 */
export function createSpriteComponent(
    sprite: Sprite2,
    offset?: Point,
    size?: Point,
    tint?: SpriteTint,
): SpriteComponent {
    return {
        id: SpriteComponentId,
        frame: 0,
        sprite,
        offset,
        size,
        tint,
    };
}

export const SpriteComponentId = "Sprite";
