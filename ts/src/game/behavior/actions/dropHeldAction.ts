import { log } from "../../../common/logging/logger.ts";
import type { Point } from "../../../common/point.ts";
import { pointEquals } from "../../../common/point.ts";
import {
    clearHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { dropItemAtPosition } from "../dropItem.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

/**
 * Drop the worker's held item into the world.
 *
 * If `destination` is set, the worker must already be at that tile (an
 * earlier moveTo enforces this) and the held item is placed there. If
 * `destination` is unset, the action drops on the worker's current tile —
 * panic-drop semantics that accept any visual mess so an interrupt can
 * always resolve.
 */
export type DropHeldActionData = {
    type: "dropHeld";
    destination?: Point;
    /**
     * Human-readable explanation of why the held item is being dropped. Carried
     * onto the resulting ground pile for debugging (shown in the selection
     * tile). Falls back to a generic message if the emitting planner omits it.
     */
    reason?: string;
};

export function executeDropHeldAction(
    action: DropHeldActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const held = entity.getEcsComponent(HeldItemComponentId);
    if (!held || isHeldEmpty(held)) {
        return ActionComplete;
    }

    const dropPos = action.destination ?? entity.worldPosition;

    if (
        action.destination !== undefined &&
        !pointEquals(entity.worldPosition, action.destination)
    ) {
        log.warn(
            `Worker ${entity.id} not at drop destination (${action.destination.x},${action.destination.y})`,
        );
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const root = entity.getRootEntity();
    const item = held.item!;
    const amount = held.amount;
    const placed = dropItemAtPosition(
        root,
        tick,
        dropPos,
        item,
        amount,
        action.reason ?? `Dropped ${item.name}`,
    );
    if (!placed) {
        // Clearing held after a refused placement would delete the goods. Fail
        // instead and let the worker replan; dropItemAtPosition logged why.
        return { kind: "failed", cause: { type: "unknown" } };
    }

    clearHeldItem(held);
    entity.invalidateComponent(HeldItemComponentId);

    return ActionComplete;
}
