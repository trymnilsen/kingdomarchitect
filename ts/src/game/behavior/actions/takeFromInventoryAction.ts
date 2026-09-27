import { log } from "../../../common/logging/logger.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    ActionComplete,
    type ActionResult,
    type ItemTransfer,
} from "./action.ts";

export type TakeFromInventoryActionData = {
    type: "takeFromInventory";
    sourceEntityId: string;
    items: ItemTransfer[];
};

/**
 * Take specific items from a source entity's inventory and add to worker's inventory.
 */
export function executeTakeFromInventoryAction(
    action: TakeFromInventoryActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const sourceEntity = root.findEntity(action.sourceEntityId);

    if (!sourceEntity) {
        log.warn(`Source entity ${action.sourceEntityId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.sourceEntityId },
        };
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
