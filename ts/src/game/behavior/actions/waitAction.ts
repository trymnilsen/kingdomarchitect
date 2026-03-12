import type { Entity } from "../../entity/entity.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
} from "./Action.ts";

export type WaitActionData = { type: "wait"; until: number };

/**
 * Wait until a specific tick time.
 */
export function executeWaitAction(
    action: WaitActionData,
    _entity: Entity,
    tick: number,
): ActionResult {
    if (tick >= action.until) {
        return ActionComplete;
    }

    return ActionRunning;
}
