import { isPointAdjacentTo } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import {
    CollectableComponentId,
    removeCollectableItems,
} from "../../component/collectableComponent.ts";
import { GroundItemComponentId } from "../../component/groundItemComponent.ts";
import { completeClaimedJob } from "../../job/jobLifecycle.ts";

import {
    addToHeldItem,
    canAddToHeld,
    HeldItemComponentId,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type CollectItemsActionData = {
    type: "collectItems";
    entityId: string;
    itemId: string;
};

/**
 * Move one named stack from an entity with a CollectableComponent into the
 * worker's held slot. Which type to take is decided when the job is created,
 * not here — the job says what the work is, and this action carries it out.
 * Any other stacks on the target are somebody else's job and are left alone.
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

    const stack = collectableComponent.items.find(
        (candidate) => candidate.item.id === action.itemId,
    );

    if (!stack) {
        // Another worker got here first between planning and arriving. The
        // point of the job was that this stack be hauled, and it has been —
        // so the job is done, not failed.
        completeClaimedJob(entity);
        return ActionComplete;
    }

    const held = entity.requireEcsComponent(HeldItemComponentId);
    if (!canAddToHeld(held, stack.item)) {
        // The planner deposits whatever the worker is carrying before a collect
        // job (see jobsRequiringEmptyHeld), so arriving with an incompatible
        // load means that deposit did not happen. Say so and replan rather than
        // let addToHeldItem throw.
        log.warn(
            `Worker ${entity.id} cannot carry ${stack.item.id}, held has ${held.item?.id}`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    addToHeldItem(held, stack.item, stack.amount);
    removeCollectableItems(collectableComponent, [stack]);
    entity.invalidateComponent(HeldItemComponentId);
    targetEntity.invalidateComponent(CollectableComponentId);

    // A ground pile exists only to hold its stack, so it goes when the stack
    // does. Anything else carrying a collectable owns its own lifetime and is
    // not ours to remove.
    if (
        collectableComponent.items.length === 0 &&
        targetEntity.hasComponent(GroundItemComponentId)
    ) {
        targetEntity.remove();
    }

    // Complete the claimed job so the post-pickup replan picks DepositHeldBehavior
    // to haul the item to a stockpile, instead of re-selecting PerformJobBehavior
    // and stranding the worker holding it.
    completeClaimedJob(entity);
    return ActionComplete;
}
