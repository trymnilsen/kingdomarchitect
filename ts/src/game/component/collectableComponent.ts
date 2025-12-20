import type { InventoryItemQuantity } from "../../data/inventory/inventoryItemQuantity.js";

export type CollectableComponent = {
    id: typeof CollectableComponentId;
    /** Items waiting to be collected from this entity */
    items: InventoryItemQuantity[];
};

export function createCollectableComponent(
    items: InventoryItemQuantity[] = [],
): CollectableComponent {
    return {
        id: CollectableComponentId,
        items,
    };
}

export const CollectableComponentId = "Collectable";

/**
 * Check if there are any items to collect
 */
export function hasCollectableItems(component: CollectableComponent): boolean {
    return component.items.length > 0;
}

/**
 * Add an item to the collectable items
 */
export function addCollectableItem(
    component: CollectableComponent,
    item: InventoryItemQuantity,
): void {
    // Check if we already have this item type, if so combine
    const existing = component.items.find((i) => i.item === item.item);
    if (existing) {
        existing.amount += item.amount;
    } else {
        component.items.push({ ...item });
    }
}

/**
 * Add multiple items to the collectable items
 */
export function addCollectableItems(
    component: CollectableComponent,
    items: InventoryItemQuantity[],
): void {
    for (const item of items) {
        addCollectableItem(component, item);
    }
}

/**
 * Collect all items (typically called by CollectItemJob)
 * Returns the items and clears the component's items array
 */
export function collectAllItems(
    component: CollectableComponent,
): InventoryItemQuantity[] {
    const items = [...component.items];
    component.items = [];
    return items;
}

/**
 * Remove specific items from the collectable component
 * Used when collecting partial amounts
 */
export function removeCollectableItems(
    component: CollectableComponent,
    itemsToRemove: InventoryItemQuantity[],
): void {
    for (const toRemove of itemsToRemove) {
        const index = component.items.findIndex(
            (i) => i.item === toRemove.item,
        );
        if (index === -1) continue;

        const existing = component.items[index];
        if (existing.amount <= toRemove.amount) {
            // Remove entirely
            component.items.splice(index, 1);
        } else {
            // Reduce amount
            existing.amount -= toRemove.amount;
        }
    }
}
