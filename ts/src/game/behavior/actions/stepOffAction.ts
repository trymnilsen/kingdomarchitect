import { adjacentPoints, type Point } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import {
    DirectionComponentId,
    updateDirectionComponent,
} from "../../component/directionComponent.ts";
import {
    MovementStaminaComponentId,
    recordMove,
} from "../../component/movementStaminaComponent.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";
import { TRAVERSAL_IMPASSABLE_THRESHOLD } from "../../component/traversalComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { discoverAfterMovement } from "../../job/movementHelper.ts";
import {
    getWeightAtPoint,
    isTileAvailable,
} from "../../map/path/graph/weight.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./Action.ts";

/**
 * Step off the building tile the worker is currently standing on, back onto a
 * free adjacent ground tile. The deliberate counterpart to {@link StepOntoActionData}.
 *
 * A plain moveTo also walks a worker off a building (A* never weights the start
 * node), but only when the *next* destination demands it. After a worker sleeps
 * in a house or operates a facility, the following behaviour can often be
 * satisfied from the building tile itself — anything that only needs to be
 * *adjacent* to its target counts the building's neighbours as adjacent — so
 * nothing pulls the worker back onto the ground and they end up working from the
 * rooftop. The StepOutsideBehavior emits this action to make leaving explicit and
 * self-healing: whenever a worker is left standing on a building with no plan that
 * keeps them there, it grounds them first.
 *
 * If every adjacent tile is blocked (other units, walls) the worker waits in
 * place — returning `running` — until a tile frees up, rather than failing.
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
        // Boxed in — hold position and try again next tick.
        log.debug(`stepOff: no free adjacent tile, waiting`);
        return ActionRunning;
    }

    discoverAfterMovement(entity, to);
    entity.updateComponent(DirectionComponentId, (component) => {
        updateDirectionComponent(component, from, to);
    });
    entity.worldPosition = to;
    const stamina = entity.getEcsComponent(MovementStaminaComponentId);
    if (stamina) {
        recordMove(stamina, tick);
        entity.invalidateComponent(MovementStaminaComponentId);
    }
    spendEntityEnergy(entity, 1);

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
