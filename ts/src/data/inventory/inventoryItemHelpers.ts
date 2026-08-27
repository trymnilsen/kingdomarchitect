import { ItemTag, type InventoryItem } from "./inventoryItem.ts";
import type { InventoryComponent } from "../../game/component/inventoryComponent.ts";
import type { InventoryItemQuantity } from "./inventoryItemQuantity.ts";
import { inventoryItemsMap } from "./inventoryItems.ts";

export function isFood(item: InventoryItem): boolean {
    return item.tag?.includes(ItemTag.Food) ?? false;
}

/**
 * Whether a worker can put this item in an equipment slot. Equippability is a
 * property of the item, so every path that offers an equip action asks here
 * rather than testing tags itself.
 *
 * Three things qualify. Skill gear, which is the ordinary case. Consumables,
 * because a potion sits in the secondary slot to be drunk. And anything
 * granting light, which is how a carried torch is equippable without being
 * mislabelled as gear that teaches a skill.
 */
export function isEquippableItem(item: InventoryItem): boolean {
    if (item.light !== undefined) {
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
