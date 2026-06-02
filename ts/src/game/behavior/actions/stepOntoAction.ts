import { isPointAdjacentTo, pointEquals } from "../../../common/point.ts";
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
import type { Entity } from "../../entity/entity.ts";
import { discoverAfterMovement } from "../../job/movementHelper.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

/**
 * Move directly onto a target entity's tile from an adjacent tile.
 *
 * Buildings stay impassable in the pathfinding graph (weight 100), so a plain
 * moveTo can only ever stop a worker *beside* a building. This action performs
 * the single, deliberate final step onto the building's own tile — the one place
 * the impassable-tile rule is intentionally bypassed — so the worker can craft,
 * operate, or sleep while standing on top of it instead of clogging a corridor.
 *
 * The planner is responsible for emitting a `moveTo` with `stopAdjacent: "cardinal"`
 * immediately before this action, so the worker is already adjacent when it runs.
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

    // Already on the tile (e.g. a mid-action replan re-queued this step).
    if (pointEquals(from, to)) {
        return ActionComplete;
    }

    if (!isPointAdjacentTo(from, to)) {
        log.warn(`stepOnto requires adjacency to ${action.targetId}`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
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
