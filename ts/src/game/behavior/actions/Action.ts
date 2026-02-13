import type { Entity } from "../../entity/entity.ts";
import type { Point } from "../../../common/point.ts";
import type { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import type { CraftingRecipe } from "../../../data/crafting/craftingRecipe.ts";

export type ActionStatus = "complete" | "running" | "failed";

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
    | { type: "moveTo"; target: Point }
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
    | { type: "attackTarget"; targetId: string };

/**
 * Action executor function type - takes action data, entity, and tick, returns status.
 */
export type BehaviorActionExecutor = (
    action: BehaviorActionData,
    entity: Entity,
    tick: number,
) => ActionStatus;
