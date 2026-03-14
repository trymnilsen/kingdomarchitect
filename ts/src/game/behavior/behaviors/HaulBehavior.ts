import { distance } from "../../../common/point.ts";
import { lerp } from "../../../common/number.ts";
import { findStockpiles } from "../../building/materialQuery.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import { getSettlementEntity } from "../../entity/settlementQueries.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";

/**
 * Soft inventory cap used for utility scaling.
 * The inventory system doesn't enforce this limit; it's used here and
 * in RestockBehavior to reason about how "full" a worker is.
 */
export const WORKER_INVENTORY_CAPACITY = 500;

/**
 * HaulBehavior causes workers to deposit non-equipped inventory items to stockpiles.
 * Utility scales with inventory pressure: near-empty bags are low priority,
 * a full bag competes with normal work.
 */
export function createHaulBehavior(): Behavior {
    return {
        name: "haul",

        isValid(entity: Entity): boolean {
            // Must have inventory with items
            const inventory = entity.getEcsComponent(InventoryComponentId);
            if (!inventory || inventory.items.length === 0) {
                return false;
            }

            // Check if there are any non-equipped items to haul
            const count = getHaulableItemCount(entity);
            if (count === 0) {
                return false;
            }

            // Must have at least one stockpile in this settlement to deposit to
            const settlement = getSettlementEntity(entity);
            const stockpiles = findStockpiles(settlement);
            return stockpiles.length > 0;
        },

        utility(entity: Entity): number {
            const count = getHaulableItemCount(entity);
            const fullness = count / WORKER_INVENTORY_CAPACITY;
            // At 1 item (~5% full): utility ≈ 8 (below idle behaviors)
            // At capacity (100% full): utility = 70 (competing with work)
            return lerp(5, 70, fullness);
        },

        expand(entity: Entity): BehaviorActionData[] {
            const settlement = getSettlementEntity(entity);
            const stockpiles = findStockpiles(settlement);

            if (stockpiles.length === 0) {
                return [];
            }

            // Find nearest stockpile
            const nearest = stockpiles.reduce((best, current) => {
                const bestDist = distance(
                    entity.worldPosition,
                    best.worldPosition,
                );
                const currentDist = distance(
                    entity.worldPosition,
                    current.worldPosition,
                );
                return currentDist < bestDist ? current : best;
            });

            return [
                {
                    type: "moveTo",
                    target: nearest.worldPosition,
                    stopAdjacent: "cardinal",
                },
                { type: "depositToStockpile", stockpileId: nearest.id },
            ];
        },
    };
}

/**
 * Get the total count of inventory items that are not currently equipped.
 * These are the items that would be hauled to a stockpile.
 */
export function getHaulableItemCount(entity: Entity): number {
    const inventory = entity.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        return 0;
    }

    const equipment = entity.getEcsComponent(EquipmentComponentId);
    const equippedItemIds = new Set<string>();

    if (equipment) {
        if (equipment.slots.main) {
            equippedItemIds.add(equipment.slots.main.id);
        }
        if (equipment.slots.other) {
            equippedItemIds.add(equipment.slots.other.id);
        }
    }

    return inventory.items
        .filter((stack) => !equippedItemIds.has(stack.item.id))
        .reduce((sum, stack) => sum + stack.amount, 0);
}
