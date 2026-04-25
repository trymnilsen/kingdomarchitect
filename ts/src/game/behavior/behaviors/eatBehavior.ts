import { distance } from "../../../common/point.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import { HungerComponentId } from "../../component/hungerComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import { getSettlementEntity } from "../../entity/settlementQueries.ts";
import { findFoodInInventory } from "../../../data/inventory/inventoryItemHelpers.ts";
import { FORAGEABLE_RESOURCE_IDS } from "./forageableResources.ts";
import { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";

export const HUNGER_THRESHOLD = 40;
export const STEAL_THRESHOLD = 80;
const STEAL_SEARCH_RADIUS = 15;
const MAX_UTILITY = 85;

export function createEatBehavior(): Behavior {
    return {
        name: "eat",

        isValid(entity: Entity): boolean {
            const hunger = entity.getEcsComponent(HungerComponentId);
            if (!hunger) return false;
            return hunger.hunger >= HUNGER_THRESHOLD;
        },

        utility(entity: Entity): number {
            const hunger = entity.getEcsComponent(HungerComponentId);
            if (!hunger || hunger.hunger < HUNGER_THRESHOLD) return 0;
            const raw = 35 + (hunger.hunger - HUNGER_THRESHOLD) * (50 / 60);
            return Math.min(MAX_UTILITY, raw);
        },

        expand(entity: Entity): BehaviorActionData[] {
            const hunger = entity.getEcsComponent(HungerComponentId);
            if (!hunger) return [];

            const inventory = entity.getEcsComponent(InventoryComponentId);

            // Stage 1: eat from inventory
            if (inventory) {
                const foodStack = findFoodInInventory(inventory);
                if (foodStack) {
                    return [{ type: "eatFromInventory" }];
                }
            }

            // Stage 2: take from any stockpile that has food
            const settlement = getSettlementEntity(entity);
            const stage2Actions = tryStockpileStage(entity, settlement);
            if (stage2Actions) return stage2Actions;

            // Stage 3: forage from world resource
            const forageActions = tryForageStage(entity);
            if (forageActions) return forageActions;

            // Stage 4: steal (only at critical hunger)
            if (hunger.hunger >= STEAL_THRESHOLD) {
                const stealActions = tryStealStage(entity);
                if (stealActions) return stealActions;
            }

            // Stage 5: nothing viable
            return [];
        },
    };
}

/**
 * Pick the nearest stockpile that holds any food and plan a fetch.
 *
 * The worker's DesiredInventoryComponent is intentionally ignored here — that
 * component expresses what the worker likes to *carry*, and is consumed by the
 * refill behavior. A hungry worker should eat whatever food is reachable, not
 * skip past a stockpile because it doesn't hold their preferred carry item.
 */
function tryStockpileStage(
    entity: Entity,
    settlement: Entity,
): BehaviorActionData[] | null {
    const stockpiles = settlement.queryComponents(StockpileComponentId);

    let nearestEntity: Entity | null = null;
    let nearestItemId: string | null = null;
    let nearestDist = Infinity;

    for (const [stockpileEntity] of stockpiles) {
        const stockpileInv = stockpileEntity.getEcsComponent(InventoryComponentId);
        if (!stockpileInv) continue;
        const foodStack = findFoodInInventory(stockpileInv);
        if (!foodStack) continue;

        const d = distance(entity.worldPosition, stockpileEntity.worldPosition);
        if (d < nearestDist) {
            nearestDist = d;
            nearestEntity = stockpileEntity;
            nearestItemId = foodStack.item.id;
        }
    }

    if (!nearestEntity || !nearestItemId) return null;

    return [
        {
            type: "moveTo",
            target: nearestEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "withdrawFromStockpile",
            stockpileId: nearestEntity.id,
            itemId: nearestItemId,
            amount: 1,
        },
        { type: "eatFromInventory" },
    ];
}

function tryForageStage(entity: Entity): BehaviorActionData[] | null {
    const root = entity.getRootEntity();
    const resourceEntities = root.queryComponents(ResourceComponentId);

    let nearestResource: Entity | null = null;
    let nearestDist = Infinity;

    for (const [resourceEntity, resourceComp] of resourceEntities) {
        if (!FORAGEABLE_RESOURCE_IDS.includes(resourceComp.resourceId)) {
            continue;
        }
        const d = distance(entity.worldPosition, resourceEntity.worldPosition);
        if (d < nearestDist) {
            nearestDist = d;
            nearestResource = resourceEntity;
        }
    }

    if (!nearestResource) return null;

    return [
        {
            type: "moveTo",
            target: nearestResource.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "harvestResource",
            entityId: nearestResource.id,
            harvestAction: ResourceHarvestMode.Pick,
        },
        { type: "eatFromInventory" },
    ];
}

function tryStealStage(entity: Entity): BehaviorActionData[] | null {
    const root = entity.getRootEntity();
    const inventoryEntities = root.queryComponents(InventoryComponentId);

    let bestTarget: Entity | null = null;
    let bestDist = Infinity;

    for (const [candidate] of inventoryEntities) {
        if (candidate.id === entity.id) continue;

        const d = distance(entity.worldPosition, candidate.worldPosition);
        if (d > STEAL_SEARCH_RADIUS) continue;

        const candidateInventory = candidate.getEcsComponent(InventoryComponentId);
        if (!candidateInventory) continue;

        const foodStack = findFoodInInventory(candidateInventory);
        if (!foodStack) continue;

        if (d < bestDist) {
            bestDist = d;
            bestTarget = candidate;
        }
    }

    if (!bestTarget) return null;

    return [
        {
            type: "moveTo",
            target: bestTarget.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "stealFood",
            targetEntityId: bestTarget.id,
        },
        { type: "eatFromInventory" },
    ];
}
