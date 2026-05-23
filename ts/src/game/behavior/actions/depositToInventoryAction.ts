import { isPointAdjacentTo, pointEquals } from "../../../common/point.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import {
    clearHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";
import { log } from "../../../common/logging/logger.ts";

/**
 * Deposit the worker's held item into a target entity's inventory.
 * Held is single-item-id, so a deposit transfers exactly the held stack
 * and clears held. Optional `itemId` enforces that the worker is carrying
 * the item the planner expected — fails if mismatched.
 */
export type DepositToInventoryActionData = {
    type: "depositToInventory";
    targetEntityId: string;
    /**
     * Optional sanity check: if set, the action fails when held holds a
     * different item id. Planners that fetched-then-deposit should set
     * this so a stale held value can't silently corrupt a building's input
     * buffer.
     */
    itemId?: string;
};

export function executeDepositToInventoryAction(
    action: DepositToInventoryActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const targetEntity = root.findEntity(action.targetEntityId);

    if (!targetEntity) {
        log.warn(`Target entity ${action.targetEntityId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.targetEntityId },
        };
    }

    if (
        !isPointAdjacentTo(targetEntity.worldPosition, entity.worldPosition) &&
        !pointEquals(targetEntity.worldPosition, entity.worldPosition)
    ) {
        log.warn(`Worker not adjacent to target`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const targetInventory =
        targetEntity.requireEcsComponent(InventoryComponentId);
    const held = entity.getEcsComponent(HeldItemComponentId);
    if (!held || isHeldEmpty(held)) {
        return ActionComplete;
    }

    if (action.itemId !== undefined && held.item!.id !== action.itemId) {
        log.warn(
            `Deposit expected ${action.itemId} but held has ${held.item!.id}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    addInventoryItem(targetInventory, held.item!, held.amount);
    clearHeldItem(held);

    entity.invalidateComponent(HeldItemComponentId);
    targetEntity.invalidateComponent(InventoryComponentId);

    return ActionComplete;
}
