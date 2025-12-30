import { removeItem } from "../../common/array.ts";
import type { InventoryItem } from "../../data/inventory/inventoryItem.ts";
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
    const existingStack = inventory.items.find(
        (stack) => stack.item.id == item.id,
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
): InventoryItemQuantity | undefined {
    const item = inventory.items.find((item) => item.item.id == id);
    return item;
}

/**
 * Takes an item out of the inventory, removing it and returning it
 * @param inventory the inventory to withdraw the item from
 * @param id the id of the item
 * @param amount amount of the item
 * @returns either the item or null if the withdrawal could not be performed
 */
export function takeInventoryItem(
    inventory: InventoryComponent,
    id: string,
    amount: number,
): InventoryItemQuantity | null {
    const item = getInventoryItem(inventory, id);
    if (!item) return null;
    if (item.amount < amount) return null;

    item.amount -= amount;
    if (item.amount <= 0) {
        removeItem(inventory.items, item);
    }
    return {
        item: item.item,
        amount,
    };
}

/**
 * Check if the inventory has at least the specified amount of an item
 * @param inventory the inventory to check
 * @param item the item to look for
 * @param amount the minimum amount required
 * @returns true if the inventory has enough of the item
 */
export function hasInventoryItems(
    inventory: InventoryComponent,
    item: InventoryItem,
    amount: number,
): boolean {
    const itemQuantity = inventory.items.find((i) => i.item === item);
    return itemQuantity !== undefined && itemQuantity.amount >= amount;
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
