import { arrayToOject } from "../../common/array.js";
import { InventoryItem } from "./inventoryItem.js";
import { equipmentItems } from "./items/equipment.js";
import { resources } from "./items/resources.js";

export const inventoryItems = [...equipmentItems, ...resources] as const;

type InventoryItemMap = {
    [Key in InventoryItemIds]: InventoryItem;
};

export const inventoryItemsMap: InventoryItemMap = Object.fromEntries(
    inventoryItems.map((item) => [item.id, item]),
) as InventoryItemMap;

export type InventoryItemIds = (typeof inventoryItems)[number]["id"];
