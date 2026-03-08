import type { InventoryItemQuantity } from "../../../../../data/inventory/inventoryItemQuantity.ts";
import { createComponent } from "../../../../../ui/declarative/ui.ts";
import { uiBookLayout } from "../../../../../ui/declarative/uiBookLayout.ts";
import type { InventoryComponent } from "../../../../component/inventoryComponent.ts";
import { inventoryGridPage } from "../../../view/inventoryGridPage.ts";
import { itemDetailsPage } from "../../../view/itemDetailsPage.ts";
import { uiScaffold } from "../../../view/uiScaffold.ts";

export type InventoryViewProps = {
    inventory: InventoryComponent;
    onItemSelected?: (index: number) => void;
    selectedItemIndex?: number;
    onEquip?: (item: InventoryItemQuantity) => void;
    onDrop?: (item: InventoryItemQuantity) => void;
    onCancel?: () => void;
};

export const inventoryView = createComponent<InventoryViewProps>(
    ({ props, withState }) => {
        const [selectedIndex, setSelectedIndex] = withState(
            props.selectedItemIndex ?? 0,
        );
        const selectedItem = props.inventory.items[selectedIndex];

        return uiScaffold({
            content: uiBookLayout({
                leftPage: inventoryGridPage({
                    inventory: props.inventory,
                    selectedIndex,
                    onSelect: (i) => {
                        setSelectedIndex(i);
                        props.onItemSelected?.(i);
                    },
                }),
                rightPage: itemDetailsPage({ item: selectedItem }),
            }),
            leftButtons: [
                {
                    text: "equip",
                    onClick: () => {
                        if (!props.onEquip) return;
                        props.onEquip(selectedItem);
                    },
                },
                {
                    text: "drop",
                    onClick: () => {
                        if (!props.onDrop) return;
                        props.onDrop(selectedItem);
                    },
                },
            ],
        });
    },
    { displayName: "InventoryView" },
);
