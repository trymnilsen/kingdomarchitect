import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult, type BehaviorActionData } from "./Action.ts";

/**
 * Deposit non-equipped inventory items to a stockpile.
 */
export function executeDepositToStockpileAction(
    action: Extract<BehaviorActionData, { type: "depositToStockpile" }>,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const stockpile = root.findEntity(action.stockpileId);

    if (!stockpile) {
        console.warn(
            `[DepositAction] Stockpile ${action.stockpileId} not found`,
        );
        return { kind: "failed", cause: { type: "targetGone", entityId: action.stockpileId } };
    }

    // Verify the stockpile has the required components
    const stockpileMarker = stockpile.getEcsComponent(StockpileComponentId);
    const stockpileInventory = stockpile.getEcsComponent(InventoryComponentId);

    if (!stockpileMarker || !stockpileInventory) {
        console.warn(
            `[DepositAction] Entity ${action.stockpileId} is not a valid stockpile`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const workerInventory = entity.getEcsComponent(InventoryComponentId);
    if (!workerInventory || workerInventory.items.length === 0) {
        // Nothing to deposit
        return ActionComplete;
    }

    // Get equipped item IDs to exclude from deposit
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    const equippedItemIds = new Set<string>();

    if (equipment) {
        if (equipment.slots.main) {
            equippedItemIds.add(equipment.slots.main.id);
        }
        if (equipment.slots.other) {
            equippedItemIds.add(equipment.slots.other.id);
        }
    }

    // Transfer non-equipped items to stockpile
    const itemsToRemove: number[] = [];

    for (let i = 0; i < workerInventory.items.length; i++) {
        const stack = workerInventory.items[i];
        if (!equippedItemIds.has(stack.item.id)) {
            addInventoryItem(stockpileInventory, stack.item, stack.amount);
            itemsToRemove.push(i);
        }
    }

    // Remove transferred items from worker inventory (in reverse order to preserve indices)
    for (let i = itemsToRemove.length - 1; i >= 0; i--) {
        workerInventory.items.splice(itemsToRemove[i], 1);
    }

    if (itemsToRemove.length > 0) {
        entity.invalidateComponent(InventoryComponentId);
        stockpile.invalidateComponent(InventoryComponentId);
        console.log(
            `[DepositAction] Entity ${entity.id} deposited ${itemsToRemove.length} item stacks to stockpile`,
        );
    }

    return ActionComplete;
}
