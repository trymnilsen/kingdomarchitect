import { log } from "../../../common/logging/logger.ts";
import {
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import {
    addToHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type WithdrawFromStockpileActionData = {
    type: "withdrawFromStockpile";
    stockpileId: string;
    itemId: string;
    amount: number;
};

/**
 * Withdraw a single item type from a stockpile into the worker's held
 * slot. Held is single-item-id, so the action fails when held already
 * holds a different item id — the caller (planner) is responsible for
 * having dropped held first.
 */
export function executeWithdrawFromStockpileAction(
    action: WithdrawFromStockpileActionData,
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
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.stockpileId },
        };
    }

    const stockpileInventory =
        stockpileEntity.getEcsComponent(InventoryComponentId);
    if (!stockpileInventory) {
        log.warn(`Stockpile ${action.stockpileId} has no inventory`);
        return { kind: "failed", cause: { type: "noResources" } };
    }

    const held = entity.requireEcsComponent(HeldItemComponentId);
    if (!isHeldEmpty(held) && held.item!.id !== action.itemId) {
        log.warn(
            `Worker ${entity.id} cannot withdraw ${action.itemId}: held has ${held.item!.id}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const taken = takeInventoryItem(
        stockpileInventory,
        action.itemId,
        action.amount,
    );
    if (!taken) {
        log.warn(
            `Stockpile ${action.stockpileId} has insufficient ${action.itemId}`,
        );
        return { kind: "failed", cause: { type: "noResources" } };
    }

    for (const stack of taken) {
        addToHeldItem(held, stack.item, stack.amount);
    }

    stockpileEntity.invalidateComponent(InventoryComponentId);
    entity.invalidateComponent(HeldItemComponentId);

    return ActionComplete;
}
