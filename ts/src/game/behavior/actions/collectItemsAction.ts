import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    CollectableComponentId,
    collectAllItems,
} from "../../component/collectableComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Collect all items from an entity with a CollectableComponent.
 * Assumes worker is already adjacent to target (moveTo should have run first).
 */
export function executeCollectItemsAction(
    action: Extract<BehaviorActionData, { type: "collectItems" }>,
    entity: Entity,
): ActionStatus {
    const root = entity.getRootEntity();
    const targetEntity = root.findEntity(action.entityId);

    if (!targetEntity) {
        console.warn(
            `[CollectItems] Target entity ${action.entityId} not found`,
        );
        return "failed";
    }

    if (!isPointAdjacentTo(targetEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[CollectItems] Worker not adjacent to target`);
        return "failed";
    }

    const collectableComponent = targetEntity.getEcsComponent(
        CollectableComponentId,
    );
    if (!collectableComponent) {
        console.warn(
            `[CollectItems] Target ${action.entityId} has no CollectableComponent`,
        );
        return "failed";
    }

    if (collectableComponent.items.length === 0) {
        return "complete";
    }

    const workerInventory = entity.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        console.warn(`[CollectItems] Worker has no inventory`);
        return "failed";
    }

    const items = collectAllItems(collectableComponent);
    for (const itemQuantity of items) {
        addInventoryItem(workerInventory, itemQuantity.item, itemQuantity.amount);
    }

    entity.invalidateComponent(InventoryComponentId);
    targetEntity.invalidateComponent(CollectableComponentId);

    return "complete";
}
