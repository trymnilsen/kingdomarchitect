import { isPointAdjacentTo, pointEquals } from "../../../common/point.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    ActionComplete,
    type ActionResult,
    type BehaviorActionData,
} from "./Action.ts";

/**
 * Deposit specific items from worker's inventory to a target entity's inventory.
 * Assumes worker is already adjacent to target (moveTo should have run first).
 */
export function executeDepositToInventoryAction(
    action: Extract<BehaviorActionData, { type: "depositToInventory" }>,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const targetEntity = root.findEntity(action.targetEntityId);

    if (!targetEntity) {
        console.warn(
            `[DepositToInventory] Target entity ${action.targetEntityId} not found`,
        );
        return { kind: "failed", cause: { type: "targetGone", entityId: action.targetEntityId } };
    }

    if (
        !isPointAdjacentTo(targetEntity.worldPosition, entity.worldPosition) &&
        !pointEquals(targetEntity.worldPosition, entity.worldPosition)
    ) {
        console.warn(`[DepositToInventory] Worker not adjacent to target`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const targetInventory =
        targetEntity.requireEcsComponent(InventoryComponentId);
    const workerInventory = entity.requireEcsComponent(InventoryComponentId);

    let depositedSomething = false;
    for (const transfer of action.items) {
        const taken = takeInventoryItem(
            workerInventory,
            transfer.itemId,
            transfer.amount,
        );
        if (taken && taken.length > 0) {
            for (const takenItem of taken) {
                addInventoryItem(
                    targetInventory,
                    takenItem.item,
                    takenItem.amount,
                );
            }
            depositedSomething = true;
        }
    }

    if (depositedSomething) {
        entity.invalidateComponent(InventoryComponentId);
        targetEntity.invalidateComponent(InventoryComponentId);
    }

    return ActionComplete;
}
