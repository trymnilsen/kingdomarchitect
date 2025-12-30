import { InventoryItem } from "./inventoryItem.ts";
import { equipmentItems } from "./items/equipment.ts";
import { resources } from "./items/resources.ts";

export const inventoryItems = [...equipmentItems, ...resources] as const;

type InventoryItemMap = {
    [Key in InventoryItemIds]: InventoryItem;
};

export const inventoryItemsMap: InventoryItemMap = Object.fromEntries(
    inventoryItems.map((item) => [item.id, item]),
) as InventoryItemMap;

export type InventoryItemIds = (typeof inventoryItems)[number]["id"];
