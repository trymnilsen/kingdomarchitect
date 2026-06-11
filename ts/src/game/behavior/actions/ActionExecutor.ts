import type { Entity } from "../../entity/entity.ts";
import type { ActionResult } from "./Action.ts";
import type {
    BehaviorActionData,
    BehaviorActionExecutor,
} from "./ActionData.ts";
import { log } from "../../../common/logging/logger.ts";

import { executeWaitAction } from "./waitAction.ts";
import { executeMoveToAction } from "./moveToAction.ts";
import { executeStepOntoAction } from "./stepOntoAction.ts";
import { executeStepOffAction } from "./stepOffAction.ts";
import { executeClearPlayerCommandAction } from "./clearPlayerCommandAction.ts";
import { executeSleepAction } from "./sleepAction.ts";
import { executeDepositToStockpileAction } from "./depositToStockpileAction.ts";
import { executeHarvestResourceAction } from "./harvestResourceAction.ts";
import { executeClearObstacleAction } from "./clearObstacleAction.ts";
import { executeConstructBuildingAction } from "./constructBuildingAction.ts";
import { executeDismantleBuildingAction } from "./dismantleBuildingAction.ts";
import { executeTakeFromInventoryAction } from "./takeFromInventoryAction.ts";
import { executeDepositToInventoryAction } from "./depositToInventoryAction.ts";
import { executeCraftItemAction } from "./craftItemAction.ts";
import { executeCollectItemsAction } from "./collectItemsAction.ts";
import { executeAttackTargetAction } from "./attackTargetAction.ts";
import { executeWarmByFireAction } from "./warmByFireAction.ts";
import { executeWithdrawFromStockpileAction } from "./withdrawFromStockpileAction.ts";
import { executePlantTreeAction } from "./plantTreeAction.ts";
import { executePlantCropAction } from "./plantCropAction.ts";
import { executeHarvestCropAction } from "./harvestCropAction.ts";
import { executeEatFromHeldAction } from "./eatFromHeldAction.ts";
import { executeDrinkFromHeldAction } from "./drinkFromHeldAction.ts";
import { executeEatFromEquipmentAction } from "./eatFromEquipmentAction.ts";
import { executeStealFoodAction } from "./stealFoodAction.ts";
import { executeWorkWindmillAction } from "./workWindmillAction.ts";
import { executeDropHeldAction } from "./dropHeldAction.ts";
import { executePickupFromGroundAction } from "./pickupFromGroundAction.ts";
import { executeEquipFromHeldAction } from "./equipFromHeldAction.ts";
import { executeDropFromSlotAction } from "./dropFromSlotAction.ts";

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
        case "stepOnto":
            return executeStepOntoAction(action, entity, tick);
        case "stepOff":
            return executeStepOffAction(action, entity, tick);
        case "clearPlayerCommand":
            return executeClearPlayerCommandAction(entity);
        case "sleep":
            return executeSleepAction(action, entity);
        case "depositToStockpile":
            return executeDepositToStockpileAction(action, entity);
        case "harvestResource":
            return executeHarvestResourceAction(action, entity, tick);
        case "clearObstacle":
            return executeClearObstacleAction(action, entity);
        case "constructBuilding":
            return executeConstructBuildingAction(action, entity);
        case "dismantleBuilding":
            return executeDismantleBuildingAction(action, entity);
        case "takeFromInventory":
            return executeTakeFromInventoryAction(action, entity);
        case "depositToInventory":
            return executeDepositToInventoryAction(action, entity);
        case "craftItem":
            return executeCraftItemAction(action, entity);
        case "collectItems":
            return executeCollectItemsAction(action, entity);
        case "attackTarget":
            return executeAttackTargetAction(action, entity, tick);
        case "warmByFire":
            return executeWarmByFireAction(action, entity);
        case "withdrawFromStockpile":
            return executeWithdrawFromStockpileAction(action, entity);
        case "plantTree":
            return executePlantTreeAction(action, entity);
        case "plantCrop":
            return executePlantCropAction(action, entity, tick);
        case "harvestCrop":
            return executeHarvestCropAction(action, entity);
        case "eatFromHeld":
            return executeEatFromHeldAction(action, entity);
        case "drinkFromHeld":
            return executeDrinkFromHeldAction(action, entity);
        case "eatFromEquipment":
            return executeEatFromEquipmentAction(action, entity);
        case "stealFood":
            return executeStealFoodAction(action, entity);
        case "workWindmill":
            return executeWorkWindmillAction(action, entity, tick);
        case "dropHeld":
            return executeDropHeldAction(action, entity);
        case "pickupFromGround":
            return executePickupFromGroundAction(action, entity);
        case "equipFromHeld":
            return executeEquipFromHeldAction(action, entity);
        case "dropFromSlot":
            return executeDropFromSlotAction(action, entity);
        default:
            log.warn(`Unknown action type: ${(action as any).type}`);
            return { kind: "failed", cause: { type: "unknown" } };
    }
};
