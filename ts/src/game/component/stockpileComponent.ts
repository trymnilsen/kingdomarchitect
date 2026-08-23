import {
    getInventoryItem,
    type InventoryComponent,
} from "./inventoryComponent.ts";

export type PreferredAmount = {
    itemId: string;
    amount: number;
};

/**
 * Marker component for buildings that act as stockpiles.
 * Stockpiles store settlement resources that workers can fetch from.
 * The preferredAmounts list signals the logistics system how much of each
 * item this stockpile wants to hold — used by the restock behavior.
 */
export type StockpileComponent = {
    id: typeof StockpileComponentId;
    preferredAmounts: PreferredAmount[];
    /** Total item count this store can hold, from Building.storageCapacity. */
    capacity: number;
};

export function createStockpileComponent(capacity: number): StockpileComponent {
    return {
        id: StockpileComponentId,
        preferredAmounts: [],
        capacity,
    };
}

export const StockpileComponentId = "stockpile";

export function getPreferredAmount(
    component: StockpileComponent,
    itemId: string,
): number | undefined {
    return component.preferredAmounts.find((p) => p.itemId === itemId)?.amount;
}

export function setPreferredAmount(
    component: StockpileComponent,
    itemId: string,
    amount: number,
): void {
    const index = component.preferredAmounts.findIndex(
        (p) => p.itemId === itemId,
    );
    if (amount === 0) {
        if (index !== -1) {
            component.preferredAmounts.splice(index, 1);
        }
        return;
    }
    if (index !== -1) {
        component.preferredAmounts[index].amount = amount;
    } else {
        component.preferredAmounts.push({ itemId, amount });
    }
}

/**
 * Items currently held, counted as a flat total across every stack. Capacity is
 * deliberately measured in items rather than stacks so that filling a store with
 * one bulky resource costs the same room as spreading it across many.
 */
export function getStockpileUsedSpace(inventory: InventoryComponent): number {
    let used = 0;
    for (const stack of inventory.items) {
        used += stack.amount;
    }
    return used;
}

/** Room left before the store is full. Never negative. */
export function getStockpileFreeSpace(
    component: StockpileComponent,
    inventory: InventoryComponent,
): number {
    return Math.max(0, component.capacity - getStockpileUsedSpace(inventory));
}

/**
 * Returns how many items are needed to reach the preferred amount.
 * Returns 0 if no preference is set for this item.
 */
export function getStockpileDeficit(
    component: StockpileComponent,
    inventory: InventoryComponent,
    itemId: string,
): number {
    const preferred = getPreferredAmount(component, itemId);
    if (preferred === undefined) {
        return 0;
    }
    const current = getInventoryItem(inventory, itemId)?.amount ?? 0;
    return Math.max(0, preferred - current);
}

/**
 * Returns how many items exceed the preferred amount.
 * If no preference is set, the entire current amount is surplus
 * (an unfiltered stockpile accepts everything as available for redistribution).
 */
export function getStockpileSurplus(
    component: StockpileComponent,
    inventory: InventoryComponent,
    itemId: string,
): number {
    const current = getInventoryItem(inventory, itemId)?.amount ?? 0;
    const preferred = getPreferredAmount(component, itemId);
    if (preferred === undefined) {
        return current;
    }
    return Math.max(0, current - preferred);
}
