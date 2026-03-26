import type { InventoryItemQuantity } from "../../../../../data/inventory/inventoryItemQuantity.ts";
import { createComponent } from "../../../../../ui/declarative/ui.ts";
import {
    UIBookLayoutPage,
    uiBookLayout,
} from "../../../../../ui/declarative/uiBookLayout.ts";
import type { InventoryComponent } from "../../../../component/inventoryComponent.ts";
import type {
    DesiredInventoryComponent,
    DesiredInventoryEntry,
} from "../../../../component/desiredInventoryComponent.ts";
import { inventoryGridPage } from "../../../view/inventoryGridPage.ts";
import { itemDetailsPage } from "../../../view/itemDetailsPage.ts";
import { uiScaffold } from "../../../view/uiScaffold.ts";
import {
    desiredInventoryLeftPage,
    desiredInventoryRightPage,
} from "./desiredInventoryView.ts";
import { spriteRefs } from "../../../../../asset/sprite.ts";

export type InventoryViewProps = {
    inventory: InventoryComponent;
    onItemSelected?: (index: number) => void;
    selectedItemIndex?: number;
    onEquip?: (item: InventoryItemQuantity) => void;
    onDrop?: (item: InventoryItemQuantity) => void;
    onCancel?: () => void;
    desiredInventory?: DesiredInventoryComponent;
    onUpdateDesiredInventory?: (items: DesiredInventoryEntry[]) => void;
};

export const inventoryView = createComponent<InventoryViewProps>(
    ({ props, withState }) => {
        const [selectedIndex, setSelectedIndex] = withState(
            props.selectedItemIndex ?? 0,
        );
        const [currentPage, setCurrentPage] = withState<UIBookLayoutPage>(
            UIBookLayoutPage.Left,
        );
        const [selectedTab, setSelectedTab] = withState(0);
        const [selectedDesiredIndex, setSelectedDesiredIndex] = withState<
            number | null
        >(null);

        const selectedItem = props.inventory.items[selectedIndex];
        const showTabs = !!props.desiredInventory;

        const tabs = showTabs
            ? [
                  {
                      icon: spriteRefs.bag_of_glitter,
                      isSelected: selectedTab === 0,
                      onTap: () => setSelectedTab(0),
                  },
                  {
                      icon: spriteRefs.scroll,
                      isSelected: selectedTab === 1,
                      onTap: () => setSelectedTab(1),
                  },
              ]
            : undefined;

        let leftPage;
        let rightPage;

        if (selectedTab === 1 && props.desiredInventory) {
            leftPage = desiredInventoryLeftPage({
                desired: props.desiredInventory,
                selectedIndex: selectedDesiredIndex,
                onSelect: (i) => setSelectedDesiredIndex(i),
            });
            rightPage = desiredInventoryRightPage({
                desired: props.desiredInventory,
                selectedIndex: selectedDesiredIndex,
                onUpdate: (items) => {
                    setSelectedDesiredIndex(null);
                    props.onUpdateDesiredInventory?.(items);
                },
            });
        } else {
            leftPage = inventoryGridPage({
                inventory: props.inventory,
                selectedIndex,
                onSelect: (i) => {
                    setSelectedIndex(i);
                    setCurrentPage(UIBookLayoutPage.Right);
                    props.onItemSelected?.(i);
                },
            });
            rightPage = itemDetailsPage({ item: selectedItem });
        }

        return uiScaffold({
            content: uiBookLayout({
                leftPage,
                rightPage,
                currentPage,
                onPageChange: (page) => setCurrentPage(page),
                tabs,
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
