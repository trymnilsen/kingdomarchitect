import { createLogger } from "../../../common/logging/logger.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult, type BehaviorActionData } from "./Action.ts";

const log = createLogger("behavior");

/**
 * Withdraw items from a stockpile into the worker's inventory.
 * Used by the restock behavior to move items between stockpiles.
 */
export function executeWithdrawFromStockpileAction(
    action: Extract<BehaviorActionData, { type: "withdrawFromStockpile" }>,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const stockpileEntity = root.findEntity(action.stockpileId);

    if (!stockpileEntity) {
        log.warn(`Stockpile ${action.stockpileId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.stockpileId },
        };
    }

    if (!stockpileEntity.getEcsComponent(StockpileComponentId)) {
        log.warn(`Entity ${action.stockpileId} is not a stockpile`);
        return { kind: "failed", cause: { type: "targetGone", entityId: action.stockpileId } };
    }

    const stockpileInventory = stockpileEntity.getEcsComponent(InventoryComponentId);
    if (!stockpileInventory) {
        log.warn(`Stockpile ${action.stockpileId} has no inventory`);
        return { kind: "failed", cause: { type: "noResources" } };
    }

    const workerInventory = entity.requireEcsComponent(InventoryComponentId);

    const taken = takeInventoryItem(stockpileInventory, action.itemId, action.amount);
    if (!taken) {
        log.warn(
            `Stockpile ${action.stockpileId} has insufficient ${action.itemId}`,
        );
        return { kind: "failed", cause: { type: "noResources" } };
    }

    for (const stack of taken) {
        addInventoryItem(workerInventory, stack.item, stack.amount);
    }

    stockpileEntity.invalidateComponent(InventoryComponentId);
    entity.invalidateComponent(InventoryComponentId);

    return ActionComplete;
}
