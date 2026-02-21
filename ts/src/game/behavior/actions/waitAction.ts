import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, ActionRunning, type ActionResult, type BehaviorActionData } from "./Action.ts";

/**
 * Wait until a specific tick time.
 */
export function executeWaitAction(
    action: Extract<BehaviorActionData, { type: "wait" }>,
    _entity: Entity,
    tick: number,
): ActionResult {
    if (tick >= action.until) {
        return ActionComplete;
    }

    return ActionRunning;
}
