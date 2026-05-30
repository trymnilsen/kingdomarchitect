import { distance } from "../../../common/point.ts";
import { ItemTag } from "../../../data/inventory/inventoryItem.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import { CollectableComponentId } from "../../component/collectableComponent.ts";
import { GroundItemComponentId } from "../../component/groundItemComponent.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
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
import { findStockpiles } from "../../building/materialQuery.ts";
import { planDepositHeld } from "../../job/planner/planDepositHeld.ts";

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

            // Stage 1: eat from equipment slot
            const equipmentSlot = findEquippedFoodSlot(entity);
            if (equipmentSlot) {
                return [{ type: "eatFromEquipment", slot: equipmentSlot }];
            }

            // Stage 2: eat from held
            const held = entity.getEcsComponent(HeldItemComponentId);
            if (
                held &&
                !isHeldEmpty(held) &&
                held.item!.tag?.includes(ItemTag.Food)
            ) {
                return [{ type: "eatFromHeld" }];
            }

            const actions: BehaviorActionData[] = [];
            const settlement = getSettlementEntity(entity);

            // Stage 3: Clear the held slot so acquired food can be eaten from
            // hand. Prefer depositing the carried item at a stockpile and only
            // drop it on the ground when none will take it (planDepositHeld).
            if (held && !isHeldEmpty(held)) {
                actions.push(...planDepositHeld(entity));
            }

            // Stage 4: walk to stockpile food
            const stockpileActions = tryStockpileStage(entity, settlement);

            if (stockpileActions) {
                actions.push(...stockpileActions);
                return actions;
            }

            // Stage 5: walk to ground pile food
            const groundPileActions = tryGroundPileStage(entity);
            if (groundPileActions) {
                actions.push(...groundPileActions);
                return actions;
            }

            // Stage 6: forage from world resource
            const forageActions = tryForageStage(entity);
            if (forageActions) {
                actions.push(...forageActions);
                return actions;
            }

            // Stage 7: steal at critical hunger
            if (hunger.hunger >= STEAL_THRESHOLD) {
                const stealActions = tryStealStage(entity);
                if (stealActions) {
                    actions.push(...stealActions);
                    return actions;
                }
            }

            // Stage 8: nothing viable
            return [];
        },
    };
}

function findEquippedFoodSlot(entity: Entity): "primary" | "secondary" | null {
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!equipment) return null;
    if (equipment.slots.primary?.tag?.includes(ItemTag.Food)) return "primary";
    if (equipment.slots.secondary?.tag?.includes(ItemTag.Food)) {
        return "secondary";
    }
    return null;
}

function tryStockpileStage(
    entity: Entity,
    settlement: Entity,
): BehaviorActionData[] | null {
    const stockpiles = settlement.queryComponents(StockpileComponentId);

    let nearestEntity: Entity | null = null;
    let nearestItemId: string | null = null;
    let nearestDist = Infinity;

    for (const [stockpileEntity] of stockpiles) {
        const stockpileInv =
            stockpileEntity.getEcsComponent(InventoryComponentId);
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
        { type: "eatFromHeld" },
    ];
}

function tryGroundPileStage(entity: Entity): BehaviorActionData[] | null {
    const root = entity.getRootEntity();
    const piles = root.queryComponents(GroundItemComponentId);

    let nearest: Entity | null = null;
    let nearestDist = Infinity;
    for (const [pile] of piles) {
        const collectable = pile.getEcsComponent(CollectableComponentId);
        if (!collectable) continue;
        const hasFood = collectable.items.some((stack) =>
            stack.item.tag?.includes(ItemTag.Food),
        );
        if (!hasFood) continue;
        const d = distance(entity.worldPosition, pile.worldPosition);
        if (d < nearestDist) {
            nearestDist = d;
            nearest = pile;
        }
    }
    if (!nearest) return null;
    return [
        {
            type: "moveTo",
            target: nearest.worldPosition,
            stopAdjacent: "cardinal",
        },
        { type: "pickupFromGround", pileEntityId: nearest.id },
        { type: "eatFromHeld" },
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
        { type: "eatFromHeld" },
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

        const candidateInventory =
            candidate.getEcsComponent(InventoryComponentId);
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
        { type: "eatFromHeld" },
    ];
}
