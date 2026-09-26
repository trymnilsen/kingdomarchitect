import type { Entity } from "../../entity/entity.ts";
import { clearPlayerCommand } from "../../component/behaviorAgentComponent.ts";
import { ActionComplete, type ActionResult } from "./action.ts";

export type ClearPlayerCommandActionData = { type: "clearPlayerCommand" };

/**
 * Queued last so an order is consumed only when it succeeds. On a failure
 * PerformPlayerCommandBehavior.onActionFailed decides whether it survives
 */
export function executeClearPlayerCommandAction(entity: Entity): ActionResult {
    clearPlayerCommand(entity);
    return ActionComplete;
}
