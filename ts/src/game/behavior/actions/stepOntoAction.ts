import { pointEquals } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import type { Entity } from "../../entity/entity.ts";
import { applyStep } from "../../job/movementHelper.ts";
import { ActionComplete, type ActionResult } from "./action.ts";

/**
 * Move directly onto a target entity's tile from an adjacent tile.
 *
 * Buildings stay impassable in the pathfinding graph (weight 100), so a plain
 * moveTo can only ever stop a worker *beside* a building. This action performs
 * the final step onto the building's own tile, the one place the impassable-tile
 * rule is bypassed. The worker can then craft, operate, or sleep while standing
 * on top of it without clogging a corridor.
 *
 * Its reach is `touch`, so the behavior system walks the worker beside the
 * target before this runs. A worker already on the tile is done.
 *
 * Stepping back off needs no companion action: A* never weights the start node, so
 * a later moveTo plans a path out of the impassable tile normally, its first step
 * landing on an adjacent walkable tile.
 */
export type StepOntoActionData = {
    type: "stepOnto";
    targetId: string;
};

export function executeStepOntoAction(
    action: StepOntoActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const root = entity.getRootEntity();
    const target = root.findEntity(action.targetId);

    if (!target) {
        log.warn(`stepOnto target ${action.targetId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.targetId },
        };
    }

    const from = entity.worldPosition;
    const to = target.worldPosition;

    if (pointEquals(from, to)) {
        return ActionComplete;
    }

    applyStep(entity, from, to, tick);

    return ActionComplete;
}
