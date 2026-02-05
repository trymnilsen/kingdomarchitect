import { removeItem } from "../../common/array.ts";
import {
    type InventoryItem,
    ItemRarity,
} from "../../data/inventory/inventoryItem.ts";
import type { InventoryItemQuantity } from "../../data/inventory/inventoryItemQuantity.ts";
import { hammerItem, swordItem } from "../../data/inventory/items/equipment.ts";
import {
    bagOfGlitter,
    blueBook,
    gemResource,
    goldCoins,
    healthPotion,
    manaPotion,
    scroll,
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../data/inventory/items/resources.ts";

export type InventoryComponent = {
    id: typeof InventoryComponentId;
    items: InventoryItemQuantity[];
};

export function createInventoryComponent(
    items: InventoryItemQuantity[] = [],
): InventoryComponent {
    return {
        id: InventoryComponentId,
        items: items,
    };
}

export const InventoryComponentId = "Inventory";

export function addInventoryItem(
    inventory: InventoryComponent,
    item: InventoryItem,
    amount: number,
) {
    const itemRarity = item.rarity ?? ItemRarity.Common;
    const existingStack = inventory.items.find(
        (stack) =>
            stack.item.id == item.id &&
            (stack.item.rarity ?? ItemRarity.Common) === itemRarity,
    );

    if (existingStack) {
        existingStack.amount += amount;
    } else {
        inventory.items.push({
            item,
            amount,
        });
    }
}

export function getInventoryItem(
    inventory: InventoryComponent,
    id: string,
    rarity?: ItemRarity,
): InventoryItemQuantity | undefined {
    const item = inventory.items.find((stack) => {
        if (stack.item.id !== id) return false;
        if (rarity !== undefined) {
            return (stack.item.rarity ?? ItemRarity.Common) === rarity;
        }
        return true;
    });
    return item;
}

/**
 * Takes items out of the inventory, removing them and returning what was taken.
 * When no rarity is specified, may pull from multiple stacks of different rarities.
 * @param inventory the inventory to withdraw the item from
 * @param id the id of the item
 * @param amount amount of the item
 * @param rarity optional rarity to match (if not specified, takes from any rarity)
 * @returns array of taken items, or null if the full amount couldn't be fulfilled
 */
export function takeInventoryItem(
    inventory: InventoryComponent,
    id: string,
    amount: number,
    rarity?: ItemRarity,
): InventoryItemQuantity[] | null {
    // Find all matching stacks
    const matchingStacks = inventory.items.filter((stack) => {
        if (stack.item.id !== id) return false;
        if (rarity !== undefined) {
            return (stack.item.rarity ?? ItemRarity.Common) === rarity;
        }
        return true;
    });

    // Check if we have enough total
    const total = matchingStacks.reduce((sum, stack) => sum + stack.amount, 0);
    if (total < amount) return null;

    // Take from stacks until we have enough
    const taken: InventoryItemQuantity[] = [];
    let remaining = amount;

    for (const stack of matchingStacks) {
        if (remaining <= 0) break;

        const takeFromStack = Math.min(stack.amount, remaining);
        stack.amount -= takeFromStack;
        remaining -= takeFromStack;

        taken.push({
            item: stack.item,
            amount: takeFromStack,
        });

        if (stack.amount <= 0) {
            removeItem(inventory.items, stack);
        }
    }

    return taken;
}

/**
 * Check if the inventory has at least the specified amount of an item
 * @param inventory the inventory to check
 * @param item the item to look for
 * @param amount the minimum amount required
 * @param rarity optional rarity to match (if not specified, sums across all rarities)
 * @returns true if the inventory has enough of the item
 */
export function hasInventoryItems(
    inventory: InventoryComponent,
    item: InventoryItem,
    amount: number,
    rarity?: ItemRarity,
): boolean {
    let total = 0;
    for (const stack of inventory.items) {
        if (stack.item.id !== item.id) continue;
        if (rarity !== undefined) {
            if ((stack.item.rarity ?? ItemRarity.Common) !== rarity) continue;
        }
        total += stack.amount;
        if (total >= amount) return true;
    }
    return false;
}

export function defaultInventoryItems(): InventoryItemQuantity[] {
    return [
        {
            amount: 200000,
            item: woodResourceItem,
        },
        {
            amount: 200000,
            item: wheatResourceItem,
        },
        {
            amount: 47,
            item: stoneResource,
        },
        {
            amount: 1,
            item: bagOfGlitter,
        },
        {
            amount: 3,
            item: gemResource,
        },
        {
            amount: 219,
            item: goldCoins,
        },
        {
            amount: 2,
            item: healthPotion,
        },
        {
            amount: 1,
            item: manaPotion,
        },
        {
            amount: 1,
            item: scroll,
        },
        {
            amount: 1,
            item: blueBook,
        },
        {
            amount: 1,
            item: swordItem,
        },
        {
            amount: 1,
            item: hammerItem,
        },
    ];
}
