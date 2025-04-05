import { zeroPoint, type Point } from "../../common/point.js";
import { emptySprite, type Sprite2 } from "../../module/asset/sprite.js";

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

export class SpriteComponent {
    sprite: Sprite2 = emptySprite;
    offset: Point = zeroPoint();
    size?: Point;
    tint: SpriteTint | null = null;
}
