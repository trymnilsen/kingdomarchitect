import { allSides } from "../../../../../common/sides.js";
import { InventoryItem } from "../../../../../data/inventory/inventoryItem.js";
import {
    InventoryItemList,
    type InventoryItemQuantity,
} from "../../../../../data/inventory/inventoryItemQuantity.js";
import { sprites2 } from "../../../../../asset/sprite.js";
import { UIThemeType, bookInkColor } from "../../../../../ui/color.js";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../../ui/declarative/ui.js";
import { uiBookLayout } from "../../../../../ui/declarative/uiBookLayout.js";
import { uiBox } from "../../../../../ui/declarative/uiBox.js";
import { uiGrid } from "../../../../../ui/declarative/uiGrid.js";
import { uiImage } from "../../../../../ui/declarative/uiImage.js";
import { uiColumn } from "../../../../../ui/declarative/uiSequence.js";
import { uiText } from "../../../../../ui/declarative/uiText.js";
import { ninePatchBackground } from "../../../../../ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize.js";
import type { InventoryComponent } from "../../../../component/inventoryComponent.js";
import { inventoryGridItem } from "./inventoryGridItem.js";
import { uiScaffold } from "../../../view/uiScaffold.js";

export type InventoryViewProps = {
    inventory: InventoryComponent;
    onItemSelected?: (index: number) => void;
    selectedItemIndex?: number;
    onEquip?: (item: InventoryItem) => void;
    onDrop?: (item: InventoryItem) => void;
    onCancel?: () => void;
};

export const inventoryView = createComponent<InventoryViewProps>(
    ({ props, withState }) => {
        const [selectedIndex, setSelectedIndex] = withState(
            props.selectedItemIndex ?? 0,
        );
        const items: InventoryItemList = props.inventory.items;

        // Create grid items
        const gridChildren: ComponentDescriptor[] = [];
        for (let i = 0; i < 24; i++) {
            const inventoryItem = items[i];
            if (inventoryItem) {
                const isSelected = i === selectedIndex;
                gridChildren.push(
                    inventoryGridItem({
                        sprite: inventoryItem.item.asset,
                        isSelected: isSelected,
                        theme: UIThemeType.Book,
                        width: 40, // Match the grid itemSize
                        height: 40,
                        onTap: () => {
                            setSelectedIndex(i);
                            props.onItemSelected?.(i);
                        },
                    }),
                );
            } else {
                gridChildren.push(
                    uiBox({
                        width: 40, // Match the grid itemSize
                        height: 40,
                        background: ninePatchBackground({
                            sprite: sprites2.book_grid_item,
                            sides: allSides(8),
                            scale: 1,
                        }),
                    }),
                );
            }
        }

        // Create grid
        const gridView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: 16,
            child: uiGrid({
                width: fillUiSize, // Adjusted to fit within book page margins (300 - 32)
                height: fillUiSize, // Adjusted to fit within book page margins (400 - 32)
                children: gridChildren,
                gap: 8,
            }),
        });

        // Create details view
        const detailsView = createDetailsView(items[selectedIndex]);
        return uiScaffold({
            content: uiBookLayout({
                leftPage: gridView,
                rightPage: detailsView,
            }),
            leftButtons: [
                {
                    text: "equip",
                },
                {
                    text: "drop",
                },
            ],
        });
    },
    { displayName: "InventoryView" },
);

function createDetailsView(
    inventoryItem?: InventoryItemQuantity,
): ComponentDescriptor {
    if (!inventoryItem) {
        return uiBox({
            width: 268, // Match the grid container width
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
        // Item image container
        uiBox({
            height: 180,
            width: fillUiSize,
            background: ninePatchBackground({
                sprite: sprites2.book_grid_item,
                sides: allSides(8),
                scale: 1,
            }),
            child: uiImage({
                sprite: inventoryItem.item.asset,
                width: 64,
                height: 64,
            }),
        }),

        // Item name
        uiText({
            content: inventoryItem.item.name,
            textStyle: {
                color: bookInkColor,
                font: "Silkscreen",
                size: 20,
            },
        }),

        // Item amount
        uiText({
            content: `amount: ${inventoryItem.amount}`,
            textStyle: {
                color: bookInkColor,
                font: "Silkscreen",
                size: 16,
            },
        }),

        // Item value
        uiText({
            content: `value: 50`,
            textStyle: {
                color: bookInkColor,
                font: "Silkscreen",
                size: 16,
            },
        }),
    ];

    // Add description if available
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
