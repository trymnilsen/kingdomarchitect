import { Sprite2, sprites2 } from "../../../../../module/asset/sprite.js";
import { allSides, symmetricSides } from "../../../../../common/sides.js";
import { InventoryItem } from "../../../../../data/inventory/inventoryItem.js";
import { InventoryItemList } from "../../../../../data/inventory/inventoryItemQuantity.js";
import { UIThemeType, bookInkColor } from "../../../../../module/ui/color.js";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../../../module/ui/dsl/uiBackgroundDsl.js";
import { fillUiSize, wrapUiSize } from "../../../../../module/ui/uiSize.js";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../../module/ui/declarative/ui.js";
import { uiBox } from "../../../../../module/ui/declarative/uiBox.js";
import { uiText } from "../../../../../module/ui/declarative/uiText.js";
import { uiImage } from "../../../../../module/ui/declarative/uiImage.js";
import { uiGrid } from "../../../../../module/ui/declarative/uiGrid.js";
import { uiBookLayout } from "../../../../../module/ui/declarative/uiBookLayout.js";
import { uiColumn } from "../../../../../module/ui/declarative/uiSequence.js";
import { inventoryGridItem } from "./inventoryGridItem.js";
import type { InventoryComponent } from "../../../../component/inventoryComponent.js";

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
            background: colorBackground("red"),
            width: fillUiSize, // Adjusted to fit within book page margins (300 - 32)
            height: fillUiSize, // Adjusted to fit within book page margins (400 - 32)
        });

        // Create details view
        const detailsView = createDetailsView(items[selectedIndex]);

        return uiBookLayout({
            leftPage: uiBox({
                background: colorBackground("red"),
                width: fillUiSize, // Adjusted to fit within book page margins (300 - 32)
                height: fillUiSize, // Adjusted to fit within book page margins (400 - 32)
            }),
            rightPage: uiBox({
                background: colorBackground("blue"),
                width: fillUiSize, // Adjusted to fit within book page margins (300 - 32)
                height: fillUiSize, // Adjusted to fit within book page margins (400 - 32)
            }),
        });
    },
    { displayName: "InventoryView" },
);

function createDetailsView(inventoryItem?: {
    item: InventoryItem;
    amount: number;
}): ComponentDescriptor {
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
        width: 268, // Match the grid container width
        height: 368,
        child: uiColumn({
            children: detailsChildren,
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
        }),
    });
}
