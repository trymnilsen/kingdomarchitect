import { getInventoryItem } from "./inventoryComponent.ts";
import type { InventoryComponent } from "./inventoryComponent.ts";

export type DesiredInventoryEntry = {
    itemId: string;
    amount: number;
};

export type DesiredInventoryComponent = {
    id: typeof DesiredInventoryComponentId;
    items: DesiredInventoryEntry[];
};

export const DesiredInventoryComponentId = "DesiredInventory" as const;

export function createDesiredInventoryComponent(
    items: DesiredInventoryEntry[] = [],
): DesiredInventoryComponent {
    return {
        id: DesiredInventoryComponentId,
        items: [...items],
    };
}

/**
 * Returns entries where the actual inventory holds less than desired.
 * Amount in each returned entry is the shortfall (desired - actual).
 */
export function getInventoryDeficit(
    desired: DesiredInventoryComponent,
    actual: InventoryComponent,
): DesiredInventoryEntry[] {
    const deficit: DesiredInventoryEntry[] = [];

    for (const entry of desired.items) {
        const stack = getInventoryItem(actual, entry.itemId);
        const haveAmount = stack?.amount ?? 0;
        const shortfall = entry.amount - haveAmount;
        if (shortfall > 0) {
            deficit.push({ itemId: entry.itemId, amount: shortfall });
        }
    }

    return deficit;
}
