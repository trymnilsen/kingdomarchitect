import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    CollectableComponentId,
    removeCollectableItems,
} from "../../component/collectableComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import {
    findJobClaimedBy,
    completeJobFromQueue,
} from "../../job/jobLifecycle.ts";

const log = createLogger("behavior");
import {
    addToHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type CollectItemsActionData = { type: "collectItems"; entityId: string };

/**
 * Collect items from an entity with a CollectableComponent into the
 * worker's held slot. Held is a single-item-id slot, so this can only
 * transfer items matching held's existing item id (or any single item id
 * when held is empty). The remainder stays on the collectable; callers
 * can re-trigger the job to collect the rest after dropping held.
 *
 * Assumes worker is already adjacent to target (moveTo should have run first).
 */
export function executeCollectItemsAction(
    action: CollectItemsActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const targetEntity = root.findEntity(action.entityId);

    if (!targetEntity) {
        log.warn(`Target entity ${action.entityId} not found`);
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
        log.warn(`Target ${action.entityId} has no CollectableComponent`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (collectableComponent.items.length === 0) {
        completeCollectJob(entity);
        return ActionComplete;
    }

    const held = entity.requireEcsComponent(HeldItemComponentId);

    // Pick which item id we are willing to take this trip.
    let acceptedItemId: string;
    if (!isHeldEmpty(held)) {
        acceptedItemId = held.item!.id;
    } else {
        acceptedItemId = collectableComponent.items[0].item.id;
    }

    const transferred: { item: typeof collectableComponent.items[number]["item"]; amount: number }[] = [];
    for (const stack of collectableComponent.items) {
        if (stack.item.id !== acceptedItemId) continue;
        addToHeldItem(held, stack.item, stack.amount);
        transferred.push({ item: stack.item, amount: stack.amount });
    }

    if (transferred.length > 0) {
        removeCollectableItems(collectableComponent, transferred);
        entity.invalidateComponent(HeldItemComponentId);
        targetEntity.invalidateComponent(CollectableComponentId);
    }

    // Only remove the entity if it was fully drained AND it is not part of
    // a building (chest-style collectables on buildings should persist).
    if (
        collectableComponent.items.length === 0 &&
        !targetEntity.hasComponent(BuildingComponentId)
    ) {
        targetEntity.remove();
    }

    completeCollectJob(entity);
    return ActionComplete;
}

/**
 * Mark the CollectItemJob claimed by this worker as complete. Mirrors the
 * job-completion step every other job-fulfilling action performs — without it
 * the claimed job lingers in the queue, so the post-pickup replan re-selects
 * PerformJobBehavior (utility 50) over DepositHeldBehavior (15) and the worker
 * strands itself holding the item instead of hauling it to a stockpile.
 */
function completeCollectJob(entity: Entity): void {
    const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
    if (!queueEntity) {
        return;
    }
    const job = findJobClaimedBy(queueEntity, entity.id);
    if (job) {
        completeJobFromQueue(queueEntity, job);
    }
}
