import { equipmentItems } from "./items/equipment.js";
import { resources } from "./items/resources.js";

export const inventoryItems = [...equipmentItems, ...resources] as const;

export type InventoryItemIds = (typeof inventoryItems)[number]["id"];
