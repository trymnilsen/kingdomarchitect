import { InventoryItem } from "./inventoryItem.js";

export enum InventoryItemTag {
    Input,
    Output,
}

export type InventoryItemQuantity = {
    item: InventoryItem;
    amount: number;
    tag?: InventoryItemTag;
};

export type InventoryItemList = readonly Readonly<InventoryItemQuantity>[];
