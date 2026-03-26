import { distance } from "../../../common/point.ts";
import { findStockpilesWithItem } from "../../building/materialQuery.ts";
import {
    InventoryComponentId,
    type InventoryComponent,
} from "../../component/inventoryComponent.ts";
import { HungerComponentId } from "../../component/hungerComponent.ts";
import { DesiredInventoryComponentId, getInventoryDeficit } from "../../component/desiredInventoryComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import { getSettlementEntity } from "../../entity/settlementQueries.ts";
import { findFoodInInventory, isFood, getInventoryItemById } from "../../../data/inventory/inventoryItemHelpers.ts";
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

            // Stage 2: restock from stockpile
            const settlement = getSettlementEntity(entity);
            const stage2Actions = tryStockpileStage(entity, settlement, inventory);
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

function tryStockpileStage(
    entity: Entity,
    settlement: Entity,
    inventory: InventoryComponent | null,
): BehaviorActionData[] | null {
    const desired = entity.getEcsComponent(DesiredInventoryComponentId);

    let foodItemId: string | null = null;
    let deficitAmount = 1;

    if (desired && inventory) {
        const deficit = getInventoryDeficit(desired, inventory);
        const foodDeficit = deficit.find((entry) => {
            const item = getInventoryItemById(entry.itemId);
            return item && isFood(item);
        });
        if (foodDeficit) {
            foodItemId = foodDeficit.itemId;
            deficitAmount = foodDeficit.amount;
        }
    }

    if (!foodItemId) {
        // Fallback: any food item in any stockpile
        const allStockpiles = settlement.queryComponents(StockpileComponentId);
        for (const [stockpileEntity] of allStockpiles) {
            const stockpileInv = stockpileEntity.getEcsComponent(InventoryComponentId);
            if (!stockpileInv) continue;
            const foodStack = findFoodInInventory(stockpileInv);
            if (foodStack) {
                foodItemId = foodStack.item.id;
                break;
            }
        }
    }

    if (!foodItemId) return null;

    const sources = findStockpilesWithItem(
        settlement,
        foodItemId,
        entity.worldPosition,
    );
    if (sources.length === 0) return null;

    const nearest = sources[0];
    const amount = Math.min(deficitAmount, nearest.availableAmount);

    return [
        {
            type: "moveTo",
            target: nearest.position,
            stopAdjacent: "cardinal",
        },
        {
            type: "withdrawFromStockpile",
            stockpileId: nearest.entity.id,
            itemId: foodItemId,
            amount,
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
