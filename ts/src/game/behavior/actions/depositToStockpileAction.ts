import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import {
    clearHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
    setHeldItem,
} from "../../component/heldItemComponent.ts";
import {
    getStockpileFreeSpace,
    StockpileComponentId,
} from "../../component/stockpileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";
import { log } from "../../../common/logging/logger.ts";

export type DepositToStockpileActionData = {
    type: "depositToStockpile";
    stockpileId: string;
};

/**
 * Deposit the worker's held item into a stockpile and clear held.
 */
export function executeDepositToStockpileAction(
    action: DepositToStockpileActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const stockpile = root.findEntity(action.stockpileId);

    if (!stockpile) {
        log.warn(`Stockpile ${action.stockpileId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.stockpileId },
        };
    }

    const stockpileMarker = stockpile.getEcsComponent(StockpileComponentId);
    const stockpileInventory = stockpile.getEcsComponent(InventoryComponentId);

    if (!stockpileMarker || !stockpileInventory) {
        log.warn(`Entity ${action.stockpileId} is not a valid stockpile`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const held = entity.getEcsComponent(HeldItemComponentId);
    if (!held || isHeldEmpty(held)) {
        return ActionComplete;
    }

    // Deposit only what fits. The remainder stays in hand so the worker carries
    // it on to another store rather than the store silently swallowing more than
    // it can hold.
    const freeSpace = getStockpileFreeSpace(
        stockpileMarker,
        stockpileInventory,
    );
    if (freeSpace <= 0) {
        log.info(
            `Stockpile ${action.stockpileId} is full, ${entity.id} keeps its load`,
        );
        return {
            kind: "failed",
            cause: { type: "stockpileFull", stockpileId: action.stockpileId },
        };
    }

    const deposited = Math.min(held.amount, freeSpace);
    const item = held.item!;
    addInventoryItem(stockpileInventory, item, deposited);
    if (deposited >= held.amount) {
        clearHeldItem(held);
    } else {
        setHeldItem(held, item, held.amount - deposited);
    }

    entity.invalidateComponent(HeldItemComponentId);
    stockpile.invalidateComponent(InventoryComponentId);
    log.info(
        `Entity ${entity.id} deposited ${deposited} into stockpile ${action.stockpileId}`,
    );

    return ActionComplete;
}
