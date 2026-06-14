import { allSides } from "../../../common/sides.ts";
import { spriteRefs } from "../../../asset/sprite.ts";
import { bookInkColor } from "../../../ui/color.ts";
import { createComponent } from "../../../ui/declarative/ui.ts";
import { uiButton } from "../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../ui/declarative/uiImage.ts";
import {
    CrossAxisAlignment,
    MainAxisAlignment,
    uiRow,
} from "../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize.ts";
import type { StockEntry } from "../../building/stockAggregate.ts";

export type StockListItemProps = {
    entry: StockEntry;
    isSelected: boolean;
    onTap?: () => void;
};

const labelStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 14,
};

/**
 * A single row in the aggregated kingdom-stock list: icon, name and the total
 * amount summed across every stockpile. The per-location breakdown lives in the
 * details page, not here.
 */
export const stockListItem = createComponent<StockListItemProps>(
    ({ props }) => {
        const background = ninePatchBackground({
            sprite: props.isSelected
                ? spriteRefs.book_grid_item_focused
                : spriteRefs.book_grid_item,
            sides: allSides(8),
            scale: 1,
        });

        return uiButton({
            width: fillUiSize,
            height: 36,
            padding: 6,
            background,
            onTap: props.onTap,
            child: uiRow({
                width: fillUiSize,
                height: fillUiSize,
                gap: 8,
                mainAxisAlignment: MainAxisAlignment.SpaceBetween,
                crossAxisAlignment: CrossAxisAlignment.Center,
                children: [
                    uiRow({
                        width: wrapUiSize,
                        height: fillUiSize,
                        gap: 8,
                        crossAxisAlignment: CrossAxisAlignment.Center,
                        children: [
                            uiImage({
                                sprite: props.entry.item.asset,
                                width: 24,
                                height: 24,
                            }),
                            uiText({
                                content: props.entry.item.name,
                                textStyle: labelStyle,
                            }),
                        ],
                    }),
                    uiText({
                        content: `${props.entry.total}`,
                        textStyle: labelStyle,
                    }),
                ],
            }),
        });
    },
    { displayName: "StockListItem" },
);
