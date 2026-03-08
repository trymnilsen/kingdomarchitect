import { getInventoryItem, type InventoryComponent } from "./inventoryComponent.ts";

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
};

export function createStockpileComponent(): StockpileComponent {
    return {
        id: StockpileComponentId,
        preferredAmounts: [],
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
