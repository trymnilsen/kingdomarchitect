import { ItemTag, type InventoryItem } from "./inventoryItem.ts";
import type { InventoryComponent } from "../../game/component/inventoryComponent.ts";
import type { InventoryItemQuantity } from "./inventoryItemQuantity.ts";
import { resources } from "./items/resources.ts";
import { processedMaterials } from "./items/processedMaterials.ts";
import { equipmentItems } from "./items/equipment.ts";

// Every defined inventory item, across all categories. getInventoryItemById
// must search the whole set: dismantle refunds buildings that cost processed
// materials (planks, ironbars, ...), which live outside `resources`. Looking
// up only `resources` silently dropped those refunds.
const allInventoryItems: readonly InventoryItem[] = [
    ...(resources as readonly InventoryItem[]),
    ...(processedMaterials as readonly InventoryItem[]),
    ...(equipmentItems as readonly InventoryItem[]),
];

export function isFood(item: InventoryItem): boolean {
    return item.tag?.includes(ItemTag.Food) ?? false;
}

export function getInventoryItemById(id: string): InventoryItem | undefined {
    return allInventoryItems.find((item) => item.id === id);
}

export function findFoodInInventory(
    inventory: InventoryComponent,
): InventoryItemQuantity | null {
    return inventory.items.find((stack) => isFood(stack.item)) ?? null;
}
