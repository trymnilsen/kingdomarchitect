import { spriteRefs } from "../../../../asset/sprite.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.ts";
import { uiBookLayout } from "../../../../ui/declarative/uiBookLayout.ts";
import type { InventoryComponent } from "../../../component/inventoryComponent.ts";
import type { StockpileComponent } from "../../../component/stockpileComponent.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { inventoryGridPage } from "../../view/inventoryGridPage.ts";
import { itemDetailsPage } from "../../view/itemDetailsPage.ts";
import { preferredAmountsListPage } from "./preferredAmountsListPage.ts";
import { preferredAmountDetailsPage } from "./preferredAmountDetailsPage.ts";
import type { InventoryItemQuantity } from "../../../../data/inventory/inventoryItemQuantity.ts";

export type StockpileViewProps = {
    stockpile: StockpileComponent;
    inventory: InventoryComponent;
    stockpileEntityId: string;
    selectedTab: number;
    selectedItemIndex: number;
    selectedItem: InventoryItemQuantity | undefined;
    selectedPreferredItemId: string | null;
    filterText: string;
    preferredPage: number;
    onTabChange: (tab: number) => void;
    onSelectInventoryItem: (index: number) => void;
    onSelectPreferredItem: (itemId: string) => void;
    onFilterTap: () => void;
    onClearFilter: () => void;
    onPageChange: (page: number) => void;
    onAmountChange: (itemId: string, delta: number) => void;
    onClearPreferredAmount: (itemId: string) => void;
    onClose: () => void;
};

export const stockpileView = createComponent<StockpileViewProps>(
    ({ props }) => {
        const leftPage: ComponentDescriptor =
            props.selectedTab === 0
                ? inventoryGridPage({
                      inventory: props.inventory,
                      selectedIndex: props.selectedItemIndex,
                      onSelect: props.onSelectInventoryItem,
                  })
                : preferredAmountsListPage({
                      stockpile: props.stockpile,
                      inventory: props.inventory,
                      stockpileEntityId: props.stockpileEntityId,
                      selectedItemId: props.selectedPreferredItemId,
                      filterText: props.filterText,
                      page: props.preferredPage,
                      onSelectItem: props.onSelectPreferredItem,
                      onFilterTap: props.onFilterTap,
                      onClearFilter: props.onClearFilter,
                      onPageChange: props.onPageChange,
                      onAmountChange: props.onAmountChange,
                  });

        const rightPage: ComponentDescriptor =
            props.selectedTab === 0
                ? itemDetailsPage({ item: props.selectedItem })
                : preferredAmountDetailsPage({
                      stockpile: props.stockpile,
                      inventory: props.inventory,
                      selectedItemId: props.selectedPreferredItemId,
                      onClear: props.onClearPreferredAmount,
                  });

        return uiScaffold({
            content: uiBookLayout({
                leftPage,
                rightPage,
                tabs: [
                    {
                        icon: spriteRefs.book_grid_item,
                        isSelected: props.selectedTab === 0,
                        onTap: () => props.onTabChange(0),
                    },
                    {
                        icon: spriteRefs.gold_coins,
                        isSelected: props.selectedTab === 1,
                        onTap: () => props.onTabChange(1),
                    },
                ],
            }),
            leftButtons: [
                {
                    text: "Close",
                    onClick: props.onClose,
                },
            ],
        });
    },
    { displayName: "StockpileView" },
);
