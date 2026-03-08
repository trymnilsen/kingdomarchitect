import { allSides } from "../../../common/sides.ts";
import { spriteRefs } from "../../../asset/sprite.ts";
import { UIThemeType } from "../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../ui/declarative/ui.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import { uiGrid } from "../../../ui/declarative/uiGrid.ts";
import { ninePatchBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize } from "../../../ui/uiSize.ts";
import type { InventoryComponent } from "../../component/inventoryComponent.ts";
import { inventoryGridItem } from "../state/root/inventory/inventoryGridItem.ts";

export type InventoryGridPageProps = {
    inventory: InventoryComponent;
    selectedIndex: number;
    onSelect: (index: number) => void;
};

/**
 * A paginated grid of inventory items with icon and selection state.
 * Used by both the worker inventory state and the stockpile inventory tab.
 */
export const inventoryGridPage = createComponent<InventoryGridPageProps>(
    ({ props }) => {
        const items = props.inventory.items;

        const gridChildren: ComponentDescriptor[] = [];
        for (let i = 0; i < 24; i++) {
            const inventoryItem = items[i];
            if (inventoryItem) {
                const isSelected = i === props.selectedIndex;
                gridChildren.push(
                    inventoryGridItem({
                        sprite: inventoryItem.item.asset,
                        isSelected: isSelected,
                        theme: UIThemeType.Book,
                        width: 40,
                        height: 40,
                        onTap: () => {
                            props.onSelect(i);
                        },
                    }),
                );
            } else {
                gridChildren.push(
                    uiBox({
                        width: 40,
                        height: 40,
                        background: ninePatchBackground({
                            sprite: spriteRefs.book_grid_item,
                            sides: allSides(8),
                            scale: 1,
                        }),
                    }),
                );
            }
        }

        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: 16,
            child: uiGrid({
                width: fillUiSize,
                height: fillUiSize,
                children: gridChildren,
                gap: 8,
            }),
        });
    },
    { displayName: "InventoryGridPage" },
);
