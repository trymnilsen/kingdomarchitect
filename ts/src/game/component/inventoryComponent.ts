import type { InventoryItemQuantity } from "../../data/inventory/inventoryItemQuantity.js";

export type InventoryComponent = {
    id: typeof InventoryComponentId;
    items: InventoryItemQuantity[];
};

export function createInventoryComponent(): InventoryComponent {
    return {
        id: InventoryComponentId,
        items: [],
    };
}

export const InventoryComponentId = "Inventory";
