import { createComponent, sized } from "../../ui/declarative/ui.js";
import {
    buildSpriteSheet,
    SpriteDefinitionCache,
} from "../characterSpriteGenerator.js";
import type { CharacterColors } from "../colors.js";
import { LAYOUT, type PreviewMode } from "./characterBuilderConstants.js";

export type CharacterPreviewProps = {
    colors: CharacterColors;
    previewMode: PreviewMode;
    selectedAnimation: string;
    currentFrame?: number;
};

/**
 * Character preview component that renders the sprite with selected colors
 * and animation. Supports both single frame and sprite sheet preview modes.
 */
export const CharacterPreview = createComponent<CharacterPreviewProps>(
    ({ props, withDraw, constraints }) => {
        // Calculate the largest size divisible by the sprite grid size that fits in the constraints
        const maxWidth =
            Math.floor(constraints.width / LAYOUT.SPRITE_GRID_SIZE) *
            LAYOUT.SPRITE_GRID_SIZE;
        const maxHeight =
            Math.floor(constraints.height / LAYOUT.SPRITE_GRID_SIZE) *
            LAYOUT.SPRITE_GRID_SIZE;
        const size = Math.min(maxWidth, maxHeight);

        withDraw((scope, region) => {
            const spriteCache = new SpriteDefinitionCache();
            const generatedSprites = buildSpriteSheet(
                (w, h) => scope.getOffscreenRenderScope(w, h),
                props.colors,
                scope.assetLoader,
                spriteCache,
            );

            // Get the selected sprite or fall back to first available
            const selectedSprite =
                generatedSprites.find(
                    (s) => s.animationName === props.selectedAnimation,
                )?.sprite || generatedSprites[0]?.sprite;

            if (!selectedSprite) return;

            let displaySprite = selectedSprite;
            let frameToDisplay = props.currentFrame ?? 0;

            if (props.previewMode === "Sheet") {
                // In sheet mode, show the entire sprite sheet
                displaySprite = {
                    ...selectedSprite,
                    defintion: {
                        ...selectedSprite.defintion,
                        frames: 1,
                        w: LAYOUT.SPRITE_GRID_SIZE,
                        h: LAYOUT.SPRITE_GRID_SIZE,
                    },
                };
                frameToDisplay = 0; // Always show first frame in sheet mode
            }

            scope.drawScreenSpaceSprite({
                x: region.x,
                y: region.y,
                targetWidth: size,
                targetHeight: size,
                sprite: displaySprite,
                frame: frameToDisplay,
            });
        });

        return sized(size, size);
    },
);
