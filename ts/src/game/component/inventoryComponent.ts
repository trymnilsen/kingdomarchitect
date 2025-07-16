import type { InventoryItemQuantity } from "../../data/inventory/inventoryItemQuantity.js";
import { hammerItem, swordItem } from "../../data/inventory/items/equipment.js";
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
} from "../../data/inventory/items/resources.js";

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
