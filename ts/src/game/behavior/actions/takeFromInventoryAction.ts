import { isPointAdjacentTo } from "../../../common/point.ts";
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
 * Take specific items from a source entity's inventory and add to worker's inventory.
 * Assumes worker is already adjacent to source (moveTo should have run first).
 */
export function executeTakeFromInventoryAction(
    action: Extract<BehaviorActionData, { type: "takeFromInventory" }>,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const sourceEntity = root.findEntity(action.sourceEntityId);

    if (!sourceEntity) {
        console.warn(
            `[TakeFromInventory] Source entity ${action.sourceEntityId} not found`,
        );
        return { kind: "failed", cause: { type: "targetGone", entityId: action.sourceEntityId } };
    }

    if (!isPointAdjacentTo(sourceEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[TakeFromInventory] Worker not adjacent to source`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const sourceInventory =
        sourceEntity.requireEcsComponent(InventoryComponentId);
    const workerInventory = entity.requireEcsComponent(InventoryComponentId);

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

    return ActionComplete;
}
