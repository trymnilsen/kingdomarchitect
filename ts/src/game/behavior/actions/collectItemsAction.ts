import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    CollectableComponentId,
    collectAllItems,
} from "../../component/collectableComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";

const log = createLogger("behavior");
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    ActionComplete,
    type ActionResult,
} from "./Action.ts";

export type CollectItemsActionData = { type: "collectItems"; entityId: string };

/**
 * Collect all items from an entity with a CollectableComponent.
 * Assumes worker is already adjacent to target (moveTo should have run first).
 */
export function executeCollectItemsAction(
    action: CollectItemsActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const targetEntity = root.findEntity(action.entityId);

    if (!targetEntity) {
        log.warn(
            `Target entity ${action.entityId} not found`,
        );
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.entityId },
        };
    }

    if (!isPointAdjacentTo(targetEntity.worldPosition, entity.worldPosition)) {
        log.warn(`Worker not adjacent to target`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const collectableComponent = targetEntity.getEcsComponent(
        CollectableComponentId,
    );
    if (!collectableComponent) {
        log.warn(
            `Target ${action.entityId} has no CollectableComponent`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (collectableComponent.items.length === 0) {
        return ActionComplete;
    }

    const workerInventory = entity.requireEcsComponent(InventoryComponentId);

    const items = collectAllItems(collectableComponent);
    for (const itemQuantity of items) {
        addInventoryItem(
            workerInventory,
            itemQuantity.item,
            itemQuantity.amount,
        );
    }

    entity.invalidateComponent(InventoryComponentId);
    targetEntity.invalidateComponent(CollectableComponentId);

    if (!targetEntity.hasComponent(BuildingComponentId)) {
        targetEntity.remove();
    }

    return ActionComplete;
}
