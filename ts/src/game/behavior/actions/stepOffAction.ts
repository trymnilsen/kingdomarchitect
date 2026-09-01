import { adjacentPoints, type Point } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import { TRAVERSAL_IMPASSABLE_THRESHOLD } from "../../component/traversalComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { applyStep } from "../../job/movementHelper.ts";
import {
    getWeightAtPoint,
    isTileAvailable,
} from "../../map/path/graph/weight.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";

/**
 * Step off the building tile the worker is currently standing on, back onto a
 * free adjacent ground tile. The explicit counterpart to {@link StepOntoActionData}.
 *
 * A plain moveTo also walks a worker off a building, since A* never weights the
 * start node, but only when the next destination demands it. After a worker
 * sleeps in a house or operates a facility, the following behaviour can often be
 * satisfied from the building tile itself, because anything that only needs to be
 * *adjacent* to its target counts the building's neighbours as adjacent. Nothing
 * pulls the worker back onto the ground, and they end up working from the
 * rooftop. StepOutsideBehavior emits this action to make leaving explicit: a
 * worker left standing on a building with no plan that keeps them there gets
 * grounded first.
 *
 * If every adjacent tile is blocked (other units, walls) the worker waits in
 * place, returning `running`, until a tile frees up. It does not fail.
 */
export type StepOffActionData = {
    type: "stepOff";
};

export function executeStepOffAction(
    _action: StepOffActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const root = entity.getRootEntity();
    const from = entity.worldPosition;

    const to = findFreeAdjacentTile(from, root);
    if (!to) {
        // Boxed in, so hold position and try again next tick.
        log.debug(`stepOff: no free adjacent tile, waiting`);
        return ActionRunning;
    }

    applyStep(entity, from, to, tick);

    return ActionComplete;
}

/**
 * Pick a cardinal-adjacent tile the worker can stand on: walkable terrain that is
 * not a solid structure and not currently occupied by another unit. The weight
 * check rejects tiles holding a unit (workers/goblins weigh in at/above the
 * impassable threshold) so a step-off never stacks two units on one tile.
 */
function findFreeAdjacentTile(from: Point, root: Entity): Point | null {
    for (const candidate of adjacentPoints(from)) {
        if (!isTileAvailable(candidate, root)) {
            continue;
        }
        if (
            getWeightAtPoint(candidate, root) >= TRAVERSAL_IMPASSABLE_THRESHOLD
        ) {
            continue;
        }
        return candidate;
    }
    return null;
}
