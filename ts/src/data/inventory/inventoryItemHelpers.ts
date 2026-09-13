import { ItemTag, type InventoryItem } from "./inventoryItem.ts";
import type { InventoryComponent } from "../../game/component/inventoryComponent.ts";
import type { InventoryItemQuantity } from "./inventoryItemQuantity.ts";
import { inventoryItemsMap } from "./inventoryItems.ts";

export function isFood(item: InventoryItem): boolean {
    return item.tag?.includes(ItemTag.Food) ?? false;
}

/**
 * Whether this item lets its holder fight with it
 */
export function isWeaponItem(item: InventoryItem): boolean {
    return item.attack !== undefined;
}

/**
 * Whether a worker can put this item in an equipment slot. Four things qualify:
 * skill gear, consumables (a potion sits in a slot to be drunk), anything
 * granting light, and anything you can fight with
 */
export function isEquippableItem(item: InventoryItem): boolean {
    if (item.light !== undefined) {
        return true;
    }
    if (isWeaponItem(item)) {
        return true;
    }
    return (
        item.tag?.some(
            (tag) => tag === ItemTag.SkillGear || tag === ItemTag.Consumable,
        ) ?? false
    );
}

export function getInventoryItemById(id: string): InventoryItem | undefined {
    return inventoryItemsMap[id as keyof typeof inventoryItemsMap];
}

export function findFoodInInventory(
    inventory: InventoryComponent,
): InventoryItemQuantity | null {
    return inventory.items.find((stack) => isFood(stack.item)) ?? null;
}
