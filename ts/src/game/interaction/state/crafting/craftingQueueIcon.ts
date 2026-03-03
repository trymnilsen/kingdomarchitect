import { allSides } from "../../../../common/sides.ts";
import { spriteRefs, type SpriteRef } from "../../../../asset/sprite.ts";
import { createComponent } from "../../../../ui/declarative/ui.ts";

export type CraftingQueueIconProps = {
    recipeIcon: SpriteRef;
    /** Progress fraction 0 to 1. 0 = not started, 1 = complete. */
    progressFraction: number;
    /** True when a worker has claimed this job. */
    isClaimed: boolean;
    /** Icon size in pixels. */
    size: number;
};

export const craftingQueueIcon = createComponent<CraftingQueueIconProps>(
    ({ props, withDraw }) => {
        withDraw((scope, region) => {
            const { x, y, width, height } = region;

            // Stone slate nine-patch background
            scope.drawNinePatchSprite({
                sprite: spriteRefs.stone_slate_background_2x,
                x,
                y,
                width,
                height,
                scale: 1,
                sides: allSides(8),
            });

            // Recipe icon centered
            scope.drawScreenSpaceSprite({
                sprite: props.recipeIcon,
                x,
                y,
                targetWidth: width,
                targetHeight: height,
            });

            // Clock reveal overlay only shown while a worker is actively crafting
            if (props.isClaimed) {
                const frame = Math.min(
                    7,
                    Math.floor(props.progressFraction * 7),
                );
                scope.drawScreenSpaceSprite({
                    sprite: spriteRefs.clock_reveal,
                    x,
                    y,
                    targetWidth: width,
                    targetHeight: height,
                    frame,
                });
            }
        });

        return {
            children: [],
            size: { width: props.size, height: props.size },
        };
    },
    { displayName: "CraftingQueueIcon" },
);
