import { InventoryItem } from "./inventoryItem.js";

export type InventoryItemQuantity = {
    item: InventoryItem;
    amount: number;
};

export type InventoryItemList = readonly Readonly<InventoryItemQuantity>[];
