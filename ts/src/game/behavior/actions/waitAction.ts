import type { Entity } from "../../entity/entity.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Wait until a specific tick time.
 */
export function executeWaitAction(
    action: Extract<BehaviorActionData, { type: "wait" }>,
    _entity: Entity,
    tick: number,
): ActionStatus {
    if (tick >= action.until) {
        return "complete";
    }

    return "running";
}
