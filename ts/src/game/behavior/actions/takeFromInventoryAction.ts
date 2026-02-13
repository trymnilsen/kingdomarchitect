import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Take specific items from a source entity's inventory and add to worker's inventory.
 * Assumes worker is already adjacent to source (moveTo should have run first).
 */
export function executeTakeFromInventoryAction(
    action: Extract<BehaviorActionData, { type: "takeFromInventory" }>,
    entity: Entity,
): ActionStatus {
    const root = entity.getRootEntity();
    const sourceEntity = root.findEntity(action.sourceEntityId);

    if (!sourceEntity) {
        console.warn(
            `[TakeFromInventory] Source entity ${action.sourceEntityId} not found`,
        );
        return "failed";
    }

    if (!isPointAdjacentTo(sourceEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[TakeFromInventory] Worker not adjacent to source`);
        return "failed";
    }

    const sourceInventory = sourceEntity.getEcsComponent(InventoryComponentId);
    if (!sourceInventory) {
        console.warn(
            `[TakeFromInventory] Source ${action.sourceEntityId} has no inventory`,
        );
        return "failed";
    }

    const workerInventory = entity.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        console.warn(`[TakeFromInventory] Worker has no inventory`);
        return "failed";
    }

    let tookSomething = false;
    for (const transfer of action.items) {
        const taken = takeInventoryItem(
            sourceInventory,
            transfer.itemId,
            transfer.amount,
        );
        if (taken && taken.length > 0) {
            for (const takenItem of taken) {
                addInventoryItem(
                    workerInventory,
                    takenItem.item,
                    takenItem.amount,
                );
            }
            tookSomething = true;
        }
    }

    if (tookSomething) {
        sourceEntity.invalidateComponent(InventoryComponentId);
        entity.invalidateComponent(InventoryComponentId);
    }

    return "complete";
}
