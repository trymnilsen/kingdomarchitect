import { distance } from "../../../common/point.ts";
import { findStockpilesWithItem } from "../../building/materialQuery.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import {
    DesiredInventoryComponentId,
    getInventoryDeficit,
} from "../../component/desiredInventoryComponent.ts";
import { getSettlementEntity } from "../../entity/settlementQueries.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";

const BASE_UTILITY = 40;
const FALLOFF = 10;

export function createRefillWorkerInventoryBehavior(): Behavior {
    return {
        name: "refillWorkerInventory",

        isValid(entity: Entity): boolean {
            const desired = entity.getEcsComponent(DesiredInventoryComponentId);
            const actual = entity.getEcsComponent(InventoryComponentId);
            if (!desired || !actual) {
                return false;
            }

            const deficit = getInventoryDeficit(desired, actual);
            if (deficit.length === 0) {
                return false;
            }

            const settlement = getSettlementEntity(entity);
            for (const entry of deficit) {
                const sources = findStockpilesWithItem(
                    settlement,
                    entry.itemId,
                    entity.worldPosition,
                );
                if (sources.length > 0) {
                    return true;
                }
            }

            return false;
        },

        utility(entity: Entity): number {
            const desired = entity.getEcsComponent(DesiredInventoryComponentId);
            const actual = entity.getEcsComponent(InventoryComponentId);
            if (!desired || !actual) {
                return 0;
            }

            const deficit = getInventoryDeficit(desired, actual);
            if (deficit.length === 0) {
                return 0;
            }

            const totalDesired = desired.items.reduce((s, e) => s + e.amount, 0);
            if (totalDesired === 0) {
                return 0;
            }

            const totalDeficit = deficit.reduce((s, e) => s + e.amount, 0);
            const deficitFactor = totalDeficit / totalDesired;

            const settlement = getSettlementEntity(entity);
            let nearestDistance = Infinity;
            for (const entry of deficit) {
                const sources = findStockpilesWithItem(
                    settlement,
                    entry.itemId,
                    entity.worldPosition,
                );
                if (sources.length > 0) {
                    const d = distance(entity.worldPosition, sources[0].position);
                    if (d < nearestDistance) {
                        nearestDistance = d;
                    }
                }
            }

            if (nearestDistance === Infinity) {
                return 0;
            }

            const proximityFactor = 1 / (1 + nearestDistance / FALLOFF);
            return deficitFactor * proximityFactor * BASE_UTILITY;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const desired = entity.getEcsComponent(DesiredInventoryComponentId);
            const actual = entity.getEcsComponent(InventoryComponentId);
            if (!desired || !actual) {
                return [];
            }

            const deficit = getInventoryDeficit(desired, actual);
            if (deficit.length === 0) {
                return [];
            }

            const settlement = getSettlementEntity(entity);

            // Find nearest stockpile that has any deficit item
            let bestEntry: { itemId: string; amount: number } | null = null;
            let bestStockpileId = "";
            let bestPosition = { x: 0, y: 0 };
            let bestAvailable = 0;
            let bestDist = Infinity;

            for (const entry of deficit) {
                const sources = findStockpilesWithItem(
                    settlement,
                    entry.itemId,
                    entity.worldPosition,
                );
                if (sources.length === 0) {
                    continue;
                }
                const nearest = sources[0];
                const d = distance(entity.worldPosition, nearest.position);
                if (d < bestDist) {
                    bestDist = d;
                    bestEntry = entry;
                    bestStockpileId = nearest.entity.id;
                    bestPosition = nearest.position;
                    bestAvailable = nearest.availableAmount;
                }
            }

            if (!bestEntry) {
                return [];
            }

            const amount = Math.min(bestEntry.amount, bestAvailable);

            return [
                {
                    type: "moveTo",
                    target: bestPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "withdrawFromStockpile",
                    stockpileId: bestStockpileId,
                    itemId: bestEntry.itemId,
                    amount,
                },
            ];
        },
    };
}
