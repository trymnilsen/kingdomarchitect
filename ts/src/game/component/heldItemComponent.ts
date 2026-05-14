import type { InventoryItem } from "../../data/inventory/inventoryItem.ts";

export type HeldItemComponent = {
    id: typeof HeldItemComponentId;
    item: InventoryItem | null;
    amount: number;
};

export const HeldItemComponentId = "HeldItem";

export function createHeldItemComponent(): HeldItemComponent {
    return {
        id: HeldItemComponentId,
        item: null,
        amount: 0,
    };
}

export function isHeldEmpty(component: HeldItemComponent): boolean {
    return component.item === null || component.amount <= 0;
}

/**
 * Replace held with a new item. Throws if held already contains a different
 * item id — caller must clear first.
 */
export function setHeldItem(
    component: HeldItemComponent,
    item: InventoryItem,
    amount: number,
): void {
    if (
        component.item !== null &&
        component.amount > 0 &&
        component.item.id !== item.id
    ) {
        throw new Error(
            `setHeldItem: held already contains '${component.item.id}', ` +
                `cannot set to '${item.id}' without clearing first`,
        );
    }
    component.item = item;
    component.amount = amount;
}

export function clearHeldItem(component: HeldItemComponent): void {
    component.item = null;
    component.amount = 0;
}

export function canAddToHeld(
    component: HeldItemComponent,
    item: InventoryItem,
): boolean {
    if (component.item === null) {
        return true;
    }

    //If we are holding the same item, we can add to it
    if (component.item.id == item.id) {
        return true;
    }

    return false;
}

/**
 * Add to existing stack. Throws if held holds a different item id.
 */
export function addToHeldItem(
    component: HeldItemComponent,
    item: InventoryItem,
    amount: number,
): void {
    if (component.item === null || component.amount <= 0) {
        component.item = item;
        component.amount = amount;
        return;
    }

    if (!canAddToHeld(component, item)) {
        throw new Error(
            `addToHeldItem: held contains '${component.item.id}', ` +
                `cannot add '${item.id}'`,
        );
    }
    component.amount += amount;
}
