import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Deposit specific items from worker's inventory to a target entity's inventory.
 * Assumes worker is already adjacent to target (moveTo should have run first).
 */
export function executeDepositToInventoryAction(
    action: Extract<BehaviorActionData, { type: "depositToInventory" }>,
    entity: Entity,
): ActionStatus {
    const root = entity.getRootEntity();
    const targetEntity = root.findEntity(action.targetEntityId);

    if (!targetEntity) {
        console.warn(
            `[DepositToInventory] Target entity ${action.targetEntityId} not found`,
        );
        return "failed";
    }

    if (!isPointAdjacentTo(targetEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[DepositToInventory] Worker not adjacent to target`);
        return "failed";
    }

    const targetInventory = targetEntity.getEcsComponent(InventoryComponentId);
    if (!targetInventory) {
        console.warn(
            `[DepositToInventory] Target ${action.targetEntityId} has no inventory`,
        );
        return "failed";
    }

    const workerInventory = entity.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        console.warn(`[DepositToInventory] Worker has no inventory`);
        return "failed";
    }

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

    return "complete";
}
