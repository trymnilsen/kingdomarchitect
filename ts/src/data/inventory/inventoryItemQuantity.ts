import { InventoryItem } from "./inventoryItem.js";

export type InventoryItemQuantity = {
    item: InventoryItem;
    amount: number;
    tag?: string;
};

export const CraftingOutputTag = "craftingoutput";

export type InventoryItemList = readonly Readonly<InventoryItemQuantity>[];
