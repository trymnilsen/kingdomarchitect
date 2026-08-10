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
    return allInventoryItems.find((item) => item.id === id);
}

export function findFoodInInventory(
    inventory: InventoryComponent,
): InventoryItemQuantity | null {
    return inventory.items.find((stack) => isFood(stack.item)) ?? null;
}
