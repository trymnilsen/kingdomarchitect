import type { Entity } from "../../entity/entity.ts";
import type {
    ActionStatus,
    BehaviorActionData,
    BehaviorActionExecutor,
} from "./Action.ts";
import { executeWaitAction } from "./waitAction.ts";
import { executeMoveToAction } from "./moveToAction.ts";
import { executePlayerMoveAction } from "./playerMoveAction.ts";
import { executeClaimJobAction } from "./claimJobAction.ts";
import { executeExecuteJobAction } from "./executeJobAction.ts";
import { executeSleepAction } from "./sleepAction.ts";
import { executeDepositToStockpileAction } from "./depositToStockpileAction.ts";

/**
 * Main action executor that dispatches to specific action handlers based on action type.
 */
export const executeAction: BehaviorActionExecutor = (
    action: BehaviorActionData,
    entity: Entity,
    tick: number,
): ActionStatus => {
    switch (action.type) {
        case "wait":
            return executeWaitAction(action, entity, tick);
        case "moveTo":
            return executeMoveToAction(action, entity);
        case "playerMove":
            return executePlayerMoveAction(action, entity);
        case "claimJob":
            return executeClaimJobAction(action, entity);
        case "executeJob":
            return executeExecuteJobAction(entity, tick);
        case "sleep":
            return executeSleepAction(entity);
        case "depositToStockpile":
            return executeDepositToStockpileAction(action, entity);
        default:
            console.warn(
                `[ActionExecutor] Unknown action type: ${(action as any).type}`,
            );
            return "failed";
    }
};
