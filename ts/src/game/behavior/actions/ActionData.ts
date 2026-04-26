import type { Entity } from "../../entity/entity.ts";
import type { ActionResult } from "./Action.ts";
import type { WaitActionData } from "./waitAction.ts";
import type { MoveToActionData } from "./moveToAction.ts";
import type { ClearPlayerCommandActionData } from "./clearPlayerCommandAction.ts";
import type { SleepActionData } from "./sleepAction.ts";
import type { DepositToStockpileActionData } from "./depositToStockpileAction.ts";
import type { HarvestResourceActionData } from "./harvestResourceAction.ts";
import type { ConstructBuildingActionData } from "./constructBuildingAction.ts";
import type { TakeFromInventoryActionData } from "./takeFromInventoryAction.ts";
import type { DepositToInventoryActionData } from "./depositToInventoryAction.ts";
import type { OperateFacilityActionData } from "./operateFacilityAction.ts";
import type { PlantTreeActionData } from "./plantTreeAction.ts";
import type { CraftItemActionData } from "./craftItemAction.ts";
import type { CollectItemsActionData } from "./collectItemsAction.ts";
import type { AttackTargetActionData } from "./attackTargetAction.ts";
import type { WarmByFireActionData } from "./warmByFireAction.ts";
import type { WithdrawFromStockpileActionData } from "./withdrawFromStockpileAction.ts";
import type { PlantCropActionData } from "./plantCropAction.ts";
import type { HarvestCropActionData } from "./harvestCropAction.ts";
import type { EatFromInventoryActionData } from "./eatFromInventoryAction.ts";
import type { StealFoodActionData } from "./stealFoodAction.ts";
import type { WorkWindmillActionData } from "./workWindmillAction.ts";

/**
 * Action data types - these are serializable plain objects that can be stored in components.
 * Each action type has its own data structure with the information needed to execute it.
 *
 * Multi-tick actions (harvest, operateFacility, craftItem) carry mutable progress fields.
 * Progress is stored on the action data itself rather than in a separate component so
 * that: (a) the action is self-contained and fully serializable, and (b) if the entity
 * replans mid-action, the abandoned progress is discarded automatically with the queue.
 */
export type BehaviorActionData =
    | WaitActionData
    | MoveToActionData
    | ClearPlayerCommandActionData
    | SleepActionData
    | DepositToStockpileActionData
    | HarvestResourceActionData
    | ConstructBuildingActionData
    | TakeFromInventoryActionData
    | DepositToInventoryActionData
    | OperateFacilityActionData
    | CraftItemActionData
    | CollectItemsActionData
    | AttackTargetActionData
    | WarmByFireActionData
    | WithdrawFromStockpileActionData
    | PlantTreeActionData
    | PlantCropActionData
    | HarvestCropActionData
    | EatFromInventoryActionData
    | StealFoodActionData
    | WorkWindmillActionData;

/**
 * Action executor function type - takes action data, entity, and tick, returns result.
 */
export type BehaviorActionExecutor = (
    action: BehaviorActionData,
    entity: Entity,
    tick: number,
) => ActionResult;
