import { SPRITE_H, SPRITE_W, type SpriteRef } from "../../asset/sprite.ts";
import { spriteRegistry } from "../../asset/spriteRegistry.ts";
import { createComponent } from "./ui.ts";

/**
 * How the sprite should be sized within the bounds.
 * - `contain`: Scale to fit within bounds, maintaining aspect ratio (may have empty space)
 * - `fill`: Scale to cover bounds, maintaining aspect ratio (may crop)
 * - `stretch`: Stretch to exactly match bounds (may distort)
 * - `none`: Use the original sprite size, ignoring width/height bounds
 */
export type UiImageFillMode = "contain" | "fill" | "stretch" | "none";

export type UiImageProps = {
    sprite: SpriteRef;
    width: number;
    height: number;
    /**
     * How the sprite should be sized within the bounds.
     * Defaults to "stretch" for backwards compatibility.
     */
    fillMode?: UiImageFillMode;
    /**
     * Optional scale factor for the sprite within the bounds.
     * Values > 1 will scale up the sprite and clip to the width/height bounds.
     * The sprite is centered within the clipped region.
     * Applied after fillMode sizing.
     */
    scale?: number;
};

export const uiImage = createComponent<UiImageProps>(
    ({ props, withDraw }) => {
        const fillMode = props.fillMode ?? "stretch";
        const scale = props.scale ?? 1;

        const spriteDef = spriteRegistry.resolve(props.sprite);
        const spriteWidth = spriteDef ? spriteDef[SPRITE_W] : props.width;
        const spriteHeight = spriteDef ? spriteDef[SPRITE_H] : props.height;

        // Calculate base dimensions based on fill mode
        let baseWidth: number;
        let baseHeight: number;

        switch (fillMode) {
            case "none":
                baseWidth = spriteWidth;
                baseHeight = spriteHeight;
                break;
            case "contain": {
                const scaleX = props.width / spriteWidth;
                const scaleY = props.height / spriteHeight;
                const containScale = Math.min(scaleX, scaleY);
                baseWidth = spriteWidth * containScale;
                baseHeight = spriteHeight * containScale;
                break;
            }
            case "fill": {
                const scaleX = props.width / spriteWidth;
                const scaleY = props.height / spriteHeight;
                const fillScale = Math.max(scaleX, scaleY);
                baseWidth = spriteWidth * fillScale;
                baseHeight = spriteHeight * fillScale;
                break;
            }
            case "stretch":
            default:
                baseWidth = props.width;
                baseHeight = props.height;
                break;
        }

        // Apply additional scale factor
        const targetWidth = baseWidth * scale;
        const targetHeight = baseHeight * scale;

        // Determine if clipping is needed (when scaled sprite exceeds bounds)
        const needsClip =
            targetWidth > props.width || targetHeight > props.height;

        // Always center the sprite within bounds
        const offsetX = (props.width - targetWidth) / 2;
        const offsetY = (props.height - targetHeight) / 2;

        withDraw((scope, region) => {
            if (needsClip) {
                scope.drawWithClip(
                    {
                        x1: region.x,
                        y1: region.y,
                        x2: region.x + props.width,
                        y2: region.y + props.height,
                    },
                    () => {
                        scope.drawScreenSpaceSprite({
                            sprite: props.sprite,
                            x: region.x + offsetX,
                            y: region.y + offsetY,
                            targetWidth: targetWidth,
                            targetHeight: targetHeight,
                        });
                    },
                );
            } else {
                scope.drawScreenSpaceSprite({
                    sprite: props.sprite,
                    x: region.x + offsetX,
                    y: region.y + offsetY,
                    targetWidth: targetWidth,
                    targetHeight: targetHeight,
                });
            }
        });

        return {
            children: [],
            size: {
                width: props.width,
                height: props.height,
            },
        };
    },
    { displayName: "UiImage" },
);
