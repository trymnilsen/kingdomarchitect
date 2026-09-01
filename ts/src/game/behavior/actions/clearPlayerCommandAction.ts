import type { Entity } from "../../entity/entity.ts";
import { clearPlayerCommand } from "../../component/behaviorAgentComponent.ts";
import { ActionComplete, type ActionResult } from "./action.ts";

export type ClearPlayerCommandActionData = { type: "clearPlayerCommand" };

/**
 * Clears the player command on the behavior agent after the associated movement
 * action has completed. This is always queued after a moveTo action produced by
 * PerformPlayerCommandBehavior so the command is consumed exactly once, when
 * the move succeeds. If the move fails, the behavior system clears the
 * action queue before this action runs and the command persists for replanning.
 */
export function executeClearPlayerCommandAction(entity: Entity): ActionResult {
    clearPlayerCommand(entity);
    return ActionComplete;
}
