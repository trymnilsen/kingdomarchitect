import { InventoryItem } from "./inventoryItem";

export interface InventoryItemQuantity {
    item: InventoryItem;
    amount: number;
}

export type InventoryItemList = ReadonlyArray<Readonly<InventoryItemQuantity>>;
