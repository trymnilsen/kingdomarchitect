import type { Entity } from "../../entity/entity.ts";
import type { Point } from "../../../common/point.ts";
import type { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import type { CraftingRecipe } from "../../../data/crafting/craftingRecipe.ts";

/**
 * Failure causes carry enough context for behaviors to branch intelligently
 * when a replan is triggered. For example, keepWarmBehavior can see that
 * the path to fire was blocked and try a different fire, or fall back to
 * building a new one. Without cause, every failure would look the same.
 */
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
 *
 * Multi-tick actions (harvest, operateFacility, craftItem) carry mutable progress fields.
 * Progress is stored on the action data itself rather than in a separate component so
 * that: (a) the action is self-contained and fully serializable, and (b) if the entity
 * replans mid-action, the abandoned progress is discarded automatically with the queue.
 *
 * The `stopAdjacent` option on moveTo lets behaviors place the entity next to a target
 * without standing on it — necessary for actions like constructBuilding or harvestResource
 * that require adjacency. "cardinal" stops one step away on N/S/E/W; "diagonal" includes
 * corners (used for warmByFire which checks Chebyshev distance).
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
    /**
     * craftItem is two-phase to avoid consuming inputs and then losing them to a replan.
     * On the first tick, inputs are taken from the worker and inputsConsumed is set to true.
     * Subsequent ticks track progress toward completion without touching inventory again.
     * If the entity replans before completion, the consumed inputs are lost — intentional,
     * as partial crafting is treated as a failed attempt.
     */
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
