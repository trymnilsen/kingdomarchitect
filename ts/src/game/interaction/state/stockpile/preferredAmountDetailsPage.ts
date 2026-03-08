import { allSides } from "../../../../common/sides.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import { bookInkColor } from "../../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../../ui/declarative/uiImage.ts";
import { uiColumn } from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { inventoryItemsMap } from "../../../../data/inventory/inventoryItems.ts";
import type { InventoryItemIds } from "../../../../data/inventory/inventoryItems.ts";
import type { StockpileComponent } from "../../../component/stockpileComponent.ts";
import { getPreferredAmount } from "../../../component/stockpileComponent.ts";
import type { InventoryComponent } from "../../../component/inventoryComponent.ts";
import { getInventoryItem } from "../../../component/inventoryComponent.ts";

export type PreferredAmountDetailsPageProps = {
    stockpile: StockpileComponent;
    inventory: InventoryComponent;
    selectedItemId: string | null;
    onClear: (itemId: string) => void;
};

/**
 * Right page of the stockpile preferred amounts tab.
 * Shows the selected item's details: icon, name, current amount vs preferred.
 */
export const preferredAmountDetailsPage =
    createComponent<PreferredAmountDetailsPageProps>(
        ({ props }) => {
            if (!props.selectedItemId) {
                return uiBox({
                    width: fillUiSize,
                    height: fillUiSize,
                    padding: 16,
                    child: uiText({
                        content: "Select an item",
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 16,
                        },
                    }),
                });
            }

            const item =
                inventoryItemsMap[
                    props.selectedItemId as InventoryItemIds
                ];
            if (!item) {
                return uiBox({ width: fillUiSize, height: fillUiSize });
            }

            const preferred = getPreferredAmount(
                props.stockpile,
                props.selectedItemId,
            );
            const current =
                getInventoryItem(props.inventory, props.selectedItemId)
                    ?.amount ?? 0;

            const statusText =
                preferred !== undefined
                    ? `${current} / ${preferred}`
                    : `${current} (no target)`;

            const children: ComponentDescriptor[] = [
                // Large item icon
                uiBox({
                    height: 120,
                    width: fillUiSize,
                    background: ninePatchBackground({
                        sprite: spriteRefs.book_grid_item,
                        sides: allSides(8),
                        scale: 1,
                    }),
                    child: uiImage({
                        sprite: item.asset,
                        width: 64,
                        height: 64,
                    }),
                }),

                uiText({
                    content: item.name,
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 18,
                    },
                }),

                uiText({
                    content: statusText,
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                }),
            ];

            if (preferred !== undefined) {
                children.push(
                    uiButton({
                        width: fillUiSize,
                        height: 32,
                        onTap: () =>
                            props.onClear(props.selectedItemId!),
                        child: uiText({
                            content: "Clear",
                            textStyle: {
                                color: bookInkColor,
                                font: "Silkscreen",
                                size: 16,
                            },
                        }),
                    }),
                );
            }

            return uiBox({
                width: fillUiSize,
                height: fillUiSize,
                padding: 12,
                child: uiColumn({
                    width: fillUiSize,
                    height: wrapUiSize,
                    gap: 8,
                    children,
                }),
            });
        },
        { displayName: "PreferredAmountDetailsPage" },
    );
