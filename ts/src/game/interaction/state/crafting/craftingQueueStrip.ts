import { allSides } from "../../../../common/sides.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.ts";
import { uiRow } from "../../../../ui/declarative/uiSequence.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { wrapUiSize } from "../../../../ui/uiSize.ts";
import { bookInkColor } from "../../../../ui/color.ts";
import type { CraftingJobDisplayInfo } from "../../../job/craftingJobQuery.ts";
import { craftingQueueIcon } from "./craftingQueueIcon.ts";

const overflowTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
};

const iconSize = 32;

export type CraftingQueueStripProps = {
    displayInfos: CraftingJobDisplayInfo[];
    /** Maximum number of icons visible before overflow badge. Defaults to 5. */
    maxVisible?: number;
};

export const craftingQueueStrip = createComponent<CraftingQueueStripProps>(
    ({ props }) => {
        const maxVisible = props.maxVisible ?? 5;
        const { displayInfos } = props;

        if (displayInfos.length === 0) {
            return uiRow({
                width: 0,
                height: 0,
                children: [],
            });
        }

        const hasOverflow = displayInfos.length > maxVisible;
        const visibleCount = hasOverflow ? maxVisible - 1 : displayInfos.length;
        const overflowCount = displayInfos.length - visibleCount;

        const children: ComponentDescriptor[] = [];

        for (let i = 0; i < visibleCount; i++) {
            const info = displayInfos[i];
            children.push(
                craftingQueueIcon({
                    recipeIcon: info.job.recipe.icon,
                    progressFraction: info.progressFraction,
                    isClaimed: info.job.claimedBy !== undefined,
                    size: iconSize,
                }),
            );
        }

        if (hasOverflow) {
            // Non-interactive overflow badge showing how many more jobs exist
            children.push(
                uiBox({
                    width: iconSize,
                    height: iconSize,
                    background: ninePatchBackground({
                        sprite: spriteRefs.stone_slate_background_2x,
                        sides: allSides(8),
                        scale: 1,
                    }),
                    child: uiText({
                        content: `+${overflowCount}`,
                        textStyle: overflowTextStyle,
                    }),
                }),
            );
        }

        return uiRow({
            width: wrapUiSize,
            height: wrapUiSize,
            gap: 4,
            children,
        });
    },
    { displayName: "CraftingQueueStrip" },
);
