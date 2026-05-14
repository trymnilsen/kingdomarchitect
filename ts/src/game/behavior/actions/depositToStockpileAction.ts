import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import {
    clearHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    ActionComplete,
    type ActionResult,
} from "./Action.ts";
import { createLogger } from "../../../common/logging/logger.ts";

const log = createLogger("behavior");

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

    addInventoryItem(stockpileInventory, held.item!, held.amount);
    clearHeldItem(held);

    entity.invalidateComponent(HeldItemComponentId);
    stockpile.invalidateComponent(InventoryComponentId);
    log.info(
        `Entity ${entity.id} deposited held into stockpile ${action.stockpileId}`,
    );

    return ActionComplete;
}
