import type { InventoryItem } from "../../../data/inventory/inventoryItem.ts";
import { inventoryItems } from "../../../data/inventory/inventoryItems.ts";
import type { EquipmentSpriteVariant } from "../../../rendering/character/characterColors.ts";

export type ItemWithVisual = InventoryItem & {
    readonly visual: EquipmentSpriteVariant;
};

function hasVisual(item: InventoryItem): item is ItemWithVisual {
    return item.visual !== undefined;
}

const allItems: readonly InventoryItem[] = inventoryItems;

/** Read from the item data so the builder previews exactly what the game draws. */
export const ITEMS_WITH_VISUAL: readonly ItemWithVisual[] =
    allItems.filter(hasVisual);
