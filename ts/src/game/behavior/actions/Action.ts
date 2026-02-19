import type { Entity } from "../../entity/entity.ts";
import type { Point } from "../../../common/point.ts";
import type { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import type { CraftingRecipe } from "../../../data/crafting/craftingRecipe.ts";

export type FailureCause =
    | { type: "pathBlocked"; target: Point }
    | { type: "targetGone"; entityId: string }
    | { type: "notAdjacent" }
    | { type: "noResources" }
    | { type: "unknown" };

export type ActionFailure = {
    actionType: string;
    cause: FailureCause;
};

export type ActionResult =
    | { kind: "complete" }
    | { kind: "running" }
    | { kind: "failed"; cause: FailureCause };

/**
 * Action completed successfully. The action will be removed from the queue
 * and the next action (if any) will be executed on the following tick.
 */
export const ActionComplete: ActionResult = { kind: "complete" };

/**
 * Action is still in progress. The action remains in the queue and will
 * be executed again on the next tick.
 */
export const ActionRunning: ActionResult = { kind: "running" };

/**
 * Item transfer specification for inventory actions
 */
export type ItemTransfer = {
    itemId: string;
    amount: number;
};

/**
 * Action data types - these are serializable plain objects that can be stored in components.
 * Each action type has its own data structure with the information needed to execute it.
 */
export type BehaviorActionData =
    | { type: "wait"; until: number }
    | { type: "moveTo"; target: Point; stopAdjacent?: "cardinal" | "diagonal" }
    | { type: "playerMove"; target: Point }
    | { type: "sleep" }
    | { type: "depositToStockpile"; stockpileId: string }
    | { type: "harvestResource"; entityId: string; harvestAction: ResourceHarvestMode; workProgress?: number }
    | { type: "constructBuilding"; entityId: string }
    | { type: "takeFromInventory"; sourceEntityId: string; items: ItemTransfer[] }
    | { type: "depositToInventory"; targetEntityId: string; items: ItemTransfer[] }
    | { type: "operateFacility"; buildingId: string; progress?: number }
    | { type: "craftItem"; buildingId: string; recipe: CraftingRecipe; progress?: number; inputsConsumed?: boolean }
    | { type: "collectItems"; entityId: string }
    | { type: "attackTarget"; targetId: string }
    | { type: "warmByFire"; fireEntityId: string };

/**
 * Action executor function type - takes action data, entity, and tick, returns result.
 */
export type BehaviorActionExecutor = (
    action: BehaviorActionData,
    entity: Entity,
    tick: number,
) => ActionResult;
