import { SPRITE_H, SPRITE_W, type SpriteRef } from "../../asset/sprite.ts";
import { spriteRegistry } from "../../asset/spriteRegistry.ts";
import { createComponent } from "./ui.ts";
import { uiImage } from "./uiImage.ts";

export type UiIconProps = {
    sprite: SpriteRef;
    /** The square box the icon is laid out in. */
    size: number;
    key?: string | number;
};

/**
 * A sprite icon rendered crisply inside a fixed square box. It picks the largest
 * integer scale whose result still fits the box, so a 16px sprite in a 32px box
 * draws at a clean 2x and a 32px sprite draws at 1x — never a fractional fit that
 * blurs pixel art. Sprites larger than the box fall back to an aspect-preserving
 * fit. The box size is fixed regardless of the sprite, so rows stay aligned.
 */
export const uiIcon = createComponent<UiIconProps>(
    ({ props }) => {
        const spriteDef = spriteRegistry.resolve(props.sprite);
        const nativeWidth = spriteDef?.[SPRITE_W] ?? props.size;
        const nativeHeight = spriteDef?.[SPRITE_H] ?? props.size;

        const fitScale = Math.min(
            props.size / nativeWidth,
            props.size / nativeHeight,
        );
        const integerScale = Math.floor(fitScale);

        if (integerScale >= 1) {
            return uiImage({
                sprite: props.sprite,
                width: props.size,
                height: props.size,
                fillMode: "none",
                scale: integerScale,
            });
        }

        // Sprite is larger than the box: keep it bounded even if that means a
        // non-integer fit.
        return uiImage({
            sprite: props.sprite,
            width: props.size,
            height: props.size,
            fillMode: "contain",
        });
    },
    { displayName: "UiIcon" },
);
