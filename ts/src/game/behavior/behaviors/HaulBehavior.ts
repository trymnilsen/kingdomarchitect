import { distance } from "../../../common/point.ts";
import { findStockpiles } from "../../building/materialQuery.ts";
import { EquipmentComponentId } from "../../component/equipmentComponent.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/Action.ts";
import type { Behavior } from "./Behavior.ts";

/**
 * HaulBehavior causes workers to deposit non-equipped inventory items to stockpiles.
 * This is a low-priority behavior that runs when the worker has nothing else to do.
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
            const haulableItems = getHaulableItems(entity);
            if (haulableItems.length === 0) {
                return false;
            }

            // Must have at least one stockpile to deposit to
            const root = entity.getRootEntity();
            const stockpiles = findStockpiles(root);
            return stockpiles.length > 0;
        },

        utility(_entity: Entity): number {
            // Low priority (25) - below normal work (50), above idle
            return 25;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const root = entity.getRootEntity();
            const stockpiles = findStockpiles(root);

            if (stockpiles.length === 0) {
                return [];
            }

            // Find nearest stockpile
            const nearest = stockpiles.reduce((best, current) => {
                const bestDist = distance(entity.worldPosition, best.worldPosition);
                const currentDist = distance(entity.worldPosition, current.worldPosition);
                return currentDist < bestDist ? current : best;
            });

            return [
                { type: "moveTo", target: nearest.worldPosition },
                { type: "depositToStockpile", stockpileId: nearest.id },
            ];
        },
    };
}

/**
 * Get inventory items that are not currently equipped.
 * These are the items that can be hauled to a stockpile.
 */
function getHaulableItems(entity: Entity): string[] {
    const inventory = entity.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        return [];
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

    // Return item IDs that are not equipped
    return inventory.items
        .filter((stack) => !equippedItemIds.has(stack.item.id))
        .map((stack) => stack.item.id);
}
