import { createLogger } from "../../../common/logging/logger.ts";
import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    CollectableComponentId,
    collectAllItems,
} from "../../component/collectableComponent.ts";
import { GroundItemComponentId } from "../../component/groundItemComponent.ts";
import {
    addToHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

/**
 * Pick up a single ground pile (entity with GroundItemComponent +
 * CollectableComponent) into the worker's held slot.
 *
 * - Worker must be cardinally adjacent to the pile.
 * - If held is empty, transfers the pile contents into held.
 * - If held holds the same item id, stacks the pile onto held.
 * - If held holds a different item id, the action fails. Caller is
 *   responsible for clearing held first.
 * - The pile entity is removed once drained.
 */
export type PickupFromGroundActionData = {
    type: "pickupFromGround";
    pileEntityId: string;
};

const log = createLogger("behavior");

export function executePickupFromGroundAction(
    action: PickupFromGroundActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const pile = root.findEntity(action.pileEntityId);

    if (!pile) {
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.pileEntityId },
        };
    }

    if (!pile.hasComponent(GroundItemComponentId)) {
        log.warn(
            `Pickup target ${action.pileEntityId} is not a ground item pile`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (!isPointAdjacentTo(entity.worldPosition, pile.worldPosition)) {
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const collectable = pile.getEcsComponent(CollectableComponentId);
    if (!collectable || collectable.items.length === 0) {
        // Pile is drained; remove and complete.
        pile.remove();
        return ActionComplete;
    }

    const held = entity.requireEcsComponent(HeldItemComponentId);

    // Ground piles only ever hold one item id by construction (drop helper
    // enforces this), but be defensive — pull the first stack.
    const stack = collectable.items[0];

    if (!isHeldEmpty(held) && held.item!.id !== stack.item.id) {
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const items = collectAllItems(collectable);
    for (const transferred of items) {
        addToHeldItem(held, transferred.item, transferred.amount);
    }

    entity.invalidateComponent(HeldItemComponentId);
    pile.invalidateComponent(CollectableComponentId);
    pile.remove();

    return ActionComplete;
}
