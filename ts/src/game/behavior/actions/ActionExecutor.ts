import type { Entity } from "../../entity/entity.ts";
import type {
    ActionResult,
    BehaviorActionData,
    BehaviorActionExecutor,
} from "./Action.ts";
import { executeWaitAction } from "./waitAction.ts";
import { executeMoveToAction } from "./moveToAction.ts";
import { executeClearPlayerCommandAction } from "./clearPlayerCommandAction.ts";
import { executeSleepAction } from "./sleepAction.ts";
import { executeDepositToStockpileAction } from "./depositToStockpileAction.ts";
import { executeHarvestResourceAction } from "./harvestResourceAction.ts";
import { executeConstructBuildingAction } from "./constructBuildingAction.ts";
import { executeTakeFromInventoryAction } from "./takeFromInventoryAction.ts";
import { executeDepositToInventoryAction } from "./depositToInventoryAction.ts";
import { executeOperateFacilityAction } from "./operateFacilityAction.ts";
import { executeCraftItemAction } from "./craftItemAction.ts";
import { executeCollectItemsAction } from "./collectItemsAction.ts";
import { executeAttackTargetAction } from "./attackTargetAction.ts";
import { executeWarmByFireAction } from "./warmByFireAction.ts";

/**
 * Main action executor that dispatches to specific action handlers based on action type.
 */
export const executeAction: BehaviorActionExecutor = (
    action: BehaviorActionData,
    entity: Entity,
    tick: number,
): ActionResult => {
    switch (action.type) {
        case "wait":
            return executeWaitAction(action, entity, tick);
        case "moveTo":
            return executeMoveToAction(action, entity, tick);
        case "clearPlayerCommand":
            return executeClearPlayerCommandAction(entity);
        case "sleep":
            return executeSleepAction(entity);
        case "depositToStockpile":
            return executeDepositToStockpileAction(action, entity);
        case "harvestResource":
            return executeHarvestResourceAction(action, entity, tick);
        case "constructBuilding":
            return executeConstructBuildingAction(action, entity);
        case "takeFromInventory":
            return executeTakeFromInventoryAction(action, entity);
        case "depositToInventory":
            return executeDepositToInventoryAction(action, entity);
        case "operateFacility":
            return executeOperateFacilityAction(action, entity);
        case "craftItem":
            return executeCraftItemAction(action, entity);
        case "collectItems":
            return executeCollectItemsAction(action, entity);
        case "attackTarget":
            return executeAttackTargetAction(action, entity);
        case "warmByFire":
            return executeWarmByFireAction(action, entity);
        default:
            console.warn(
                `[ActionExecutor] Unknown action type: ${(action as any).type}`,
            );
            return { kind: "failed", cause: { type: "unknown" } };
    }
};
