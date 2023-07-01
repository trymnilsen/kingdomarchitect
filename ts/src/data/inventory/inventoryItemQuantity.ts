import { InventoryItem } from "./inventoryItem.js";

export interface InventoryItemQuantity {
    item: InventoryItem;
    amount: number;
}

export type InventoryItemList = ReadonlyArray<Readonly<InventoryItemQuantity>>;
