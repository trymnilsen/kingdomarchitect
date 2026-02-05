import { pointEquals } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { doMovement, MovementResult } from "../../job/movementHelper.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Move to a target position (general movement).
 */
export function executeMoveToAction(
    action: Extract<BehaviorActionData, { type: "moveTo" }>,
    entity: Entity,
): ActionStatus {
    if (pointEquals(entity.worldPosition, action.target)) {
        return "complete";
    }

    const result = doMovement(entity, action.target);

    if (result === MovementResult.Failure) {
        return "failed";
    }

    if (pointEquals(entity.worldPosition, action.target)) {
        return "complete";
    }

    return "running";
}
