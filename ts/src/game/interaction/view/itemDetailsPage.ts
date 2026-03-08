import { allSides } from "../../../common/sides.ts";
import { spriteRefs } from "../../../asset/sprite.ts";
import { bookInkColor } from "../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../ui/declarative/ui.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import { uiImage } from "../../../ui/declarative/uiImage.ts";
import { uiColumn } from "../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize.ts";
import type { InventoryItemQuantity } from "../../../data/inventory/inventoryItemQuantity.ts";

export type ItemDetailsPageProps = {
    item?: InventoryItemQuantity;
};

/**
 * A details panel showing icon, name, amount, and hint for an inventory item.
 * Used as the right page in inventory book layouts.
 */
export const itemDetailsPage = createComponent<ItemDetailsPageProps>(
    ({ props }) => {
        return createDetailsView(props.item);
    },
    { displayName: "ItemDetailsPage" },
);

function createDetailsView(
    inventoryItem?: InventoryItemQuantity,
): ComponentDescriptor {
    if (!inventoryItem) {
        return uiBox({
            width: 268,
            height: 368,
            child: uiText({
                content: "Inventory empty",
                textStyle: {
                    color: bookInkColor,
                    font: "Silkscreen",
                    size: 20,
                },
            }),
        });
    }

    const detailsChildren: ComponentDescriptor[] = [
        uiBox({
            height: 180,
            width: fillUiSize,
            background: ninePatchBackground({
                sprite: spriteRefs.book_grid_item,
                sides: allSides(8),
                scale: 1,
            }),
            child: uiImage({
                sprite: inventoryItem.item.asset,
                width: 64,
                height: 64,
            }),
        }),

        uiText({
            content: inventoryItem.item.name,
            textStyle: {
                color: bookInkColor,
                font: "Silkscreen",
                size: 20,
            },
        }),

        uiText({
            content: `amount: ${inventoryItem.amount}`,
            textStyle: {
                color: bookInkColor,
                font: "Silkscreen",
                size: 16,
            },
        }),

        uiText({
            content: `value: 50`,
            textStyle: {
                color: bookInkColor,
                font: "Silkscreen",
                size: 16,
            },
        }),
    ];

    if (inventoryItem.item.hint) {
        detailsChildren.push(
            uiText({
                content: `description:`,
                textStyle: {
                    color: bookInkColor,
                    font: "Silkscreen",
                    size: 16,
                },
            }),
            uiText({
                content: inventoryItem.item.hint,
                textStyle: {
                    color: bookInkColor,
                    font: "Silkscreen",
                    size: 16,
                },
            }),
        );
    }

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            children: detailsChildren,
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
        }),
    });
}
