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
import { uiRow, uiColumn } from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { inventoryItems } from "../../../../data/inventory/inventoryItems.ts";
import type { InventoryItem } from "../../../../data/inventory/inventoryItem.ts";
import type { StockpileComponent } from "../../../component/stockpileComponent.ts";
import { getPreferredAmount } from "../../../component/stockpileComponent.ts";
import type { InventoryComponent } from "../../../component/inventoryComponent.ts";
import { getInventoryItem } from "../../../component/inventoryComponent.ts";

const ITEMS_PER_PAGE = 8;

export type PreferredAmountsListPageProps = {
    stockpile: StockpileComponent;
    inventory: InventoryComponent;
    stockpileEntityId: string;
    selectedItemId: string | null;
    filterText: string;
    page: number;
    onSelectItem: (itemId: string) => void;
    onFilterTap: () => void;
    onClearFilter: () => void;
    onPageChange: (page: number) => void;
    onAmountChange: (itemId: string, delta: number) => void;
};

/**
 * Left page of the stockpile book — a paginated, filterable list of all
 * inventory items with +/- controls for setting preferred amounts.
 */
export const preferredAmountsListPage =
    createComponent<PreferredAmountsListPageProps>(
        ({ props }) => {
            // Sort: items with preferences first (A-Z), then rest (A-Z)
            const filterLower = props.filterText.toLowerCase();
            const allItems = [...inventoryItems].filter((item) =>
                filterLower
                    ? item.name.toLowerCase().includes(filterLower)
                    : true,
            );

            allItems.sort((a, b) => {
                const aHasPref =
                    getPreferredAmount(props.stockpile, a.id) !== undefined;
                const bHasPref =
                    getPreferredAmount(props.stockpile, b.id) !== undefined;
                if (aHasPref && !bHasPref) return -1;
                if (!aHasPref && bHasPref) return 1;
                return a.name.localeCompare(b.name);
            });

            const totalPages = Math.max(
                1,
                Math.ceil(allItems.length / ITEMS_PER_PAGE),
            );
            const page = Math.min(props.page, totalPages - 1);
            const pageItems = allItems.slice(
                page * ITEMS_PER_PAGE,
                (page + 1) * ITEMS_PER_PAGE,
            );

            const rows: ComponentDescriptor[] = [];

            // Filter button row — shows an "x" clear button when a filter is active
            const filterLabel = props.filterText
                ? `Filter: ${props.filterText}`
                : "Filter";
            const filterRowChildren: ComponentDescriptor[] = [
                uiButton({
                    width: fillUiSize,
                    height: 28,
                    onTap: props.onFilterTap,
                    child: uiText({
                        content: filterLabel,
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 14,
                        },
                    }),
                }),
            ];
            if (props.filterText) {
                filterRowChildren.push(
                    uiButton({
                        width: 28,
                        height: 28,
                        onTap: props.onClearFilter,
                        child: uiText({
                            content: "x",
                            textStyle: {
                                color: bookInkColor,
                                font: "Silkscreen",
                                size: 14,
                            },
                        }),
                    }),
                );
            }
            rows.push(
                uiRow({
                    width: fillUiSize,
                    height: wrapUiSize,
                    gap: 4,
                    children: filterRowChildren,
                }),
            );

            // Item rows
            for (const item of pageItems) {
                rows.push(createItemRow(item, props));
            }

            // Pagination row
            rows.push(
                uiRow({
                    width: fillUiSize,
                    height: wrapUiSize,
                    gap: 8,
                    children: [
                        uiButton({
                            width: 40,
                            height: 28,
                            onTap:
                                page > 0
                                    ? () => props.onPageChange(page - 1)
                                    : undefined,
                            child: uiText({
                                content: "<",
                                textStyle: {
                                    color: bookInkColor,
                                    font: "Silkscreen",
                                    size: 14,
                                },
                            }),
                        }),
                        uiText({
                            content: `${page + 1}/${totalPages}`,
                            textStyle: {
                                color: bookInkColor,
                                font: "Silkscreen",
                                size: 14,
                            },
                        }),
                        uiButton({
                            width: 40,
                            height: 28,
                            onTap:
                                page < totalPages - 1
                                    ? () => props.onPageChange(page + 1)
                                    : undefined,
                            child: uiText({
                                content: ">",
                                textStyle: {
                                    color: bookInkColor,
                                    font: "Silkscreen",
                                    size: 14,
                                },
                            }),
                        }),
                    ],
                }),
            );

            return uiBox({
                width: fillUiSize,
                height: fillUiSize,
                padding: 12,
                child: uiColumn({
                    width: fillUiSize,
                    height: fillUiSize,
                    gap: 4,
                    children: rows,
                }),
            });
        },
        { displayName: "PreferredAmountsListPage" },
    );

function createItemRow(
    item: InventoryItem,
    props: PreferredAmountsListPageProps,
): ComponentDescriptor {
    const preferred = getPreferredAmount(props.stockpile, item.id);
    const amountText = preferred !== undefined ? `${preferred}` : "—";
    const isSelected = props.selectedItemId === item.id;

    return uiBox({
        width: fillUiSize,
        height: 36,
        background: isSelected
            ? ninePatchBackground({
                  sprite: spriteRefs.book_grid_item_focused,
                  sides: allSides(8),
                  scale: 1,
              })
            : undefined,
        child: uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 4,
            children: [
                // Item icon
                uiButton({
                    width: 32,
                    height: 32,
                    onTap: () => props.onSelectItem(item.id),
                    child: uiImage({
                        sprite: item.asset,
                        width: 24,
                        height: 24,
                    }),
                }),
                // Item name (tapping selects it)
                uiButton({
                    width: fillUiSize,
                    height: 32,
                    onTap: () => props.onSelectItem(item.id),
                    child: uiText({
                        content: item.name,
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 12,
                        },
                    }),
                }),
                // Decrement button
                uiButton({
                    width: 28,
                    height: 28,
                    onTap: () =>
                        props.onAmountChange(
                            item.id,
                            -1,
                        ),
                    child: uiText({
                        content: "-",
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 16,
                        },
                    }),
                }),
                // Amount display
                uiBox({
                    width: 28,
                    height: 28,
                    child: uiText({
                        content: amountText,
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 14,
                        },
                    }),
                }),
                // Increment button
                uiButton({
                    width: 28,
                    height: 28,
                    onTap: () =>
                        props.onAmountChange(
                            item.id,
                            1,
                        ),
                    child: uiText({
                        content: "+",
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 16,
                        },
                    }),
                }),
            ],
        }),
    });
}
