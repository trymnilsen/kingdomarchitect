import { distance } from "../../../common/point.ts";
import {
    findStockpileDeficits,
    findStockpileSurplus,
} from "../../building/materialQuery.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import { getSettlementEntity } from "../../entity/settlementQueries.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";
import { WORKER_INVENTORY_CAPACITY } from "./HaulBehavior.ts";
import type { StockpileDeficit, StockpileSurplus } from "../../building/materialQuery.ts";

/**
 * RestockBehavior moves items between stockpiles to satisfy preferred amounts.
 * An idle worker with nothing better to do will restock underserved stockpiles
 * by fetching surplus from overstocked ones.
 *
 * Priority: deficit severity (how far below target as a ratio), with ties
 * broken by proximity to the worker.
 */
export function createRestockBehavior(): Behavior {
    return {
        name: "restock",

        isValid(entity: Entity): boolean {
            if (!entity.getEcsComponent(InventoryComponentId)) {
                return false;
            }

            const settlement = getSettlementEntity(entity);
            const deficits = findStockpileDeficits(settlement);
            if (deficits.length === 0) {
                return false;
            }

            // Check at least one deficit has a matching surplus source
            for (const deficit of deficits) {
                const sources = findStockpileSurplus(
                    settlement,
                    deficit.itemId,
                );
                // Source must be a different stockpile than the deficit target
                const hasValidSource = sources.some(
                    (s) => s.stockpile.id !== deficit.stockpile.id,
                );
                if (hasValidSource) {
                    return true;
                }
            }

            return false;
        },

        utility(_entity: Entity): number {
            // Below normal work (50), above wander. Will be boosted by a hauler
            // role/occupation in a future pass.
            return 15;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const settlement = getSettlementEntity(entity);
            const deficits = findStockpileDeficits(settlement);

            // Pick the task with worst deficit ratio (most urgent), ties broken by proximity
            let bestDeficit: StockpileDeficit | null = null;
            let bestSource: StockpileSurplus | null = null;
            let bestScore = -1;

            for (const deficit of deficits) {
                const sources = findStockpileSurplus(
                    settlement,
                    deficit.itemId,
                );
                const validSources = sources.filter(
                    (s) => s.stockpile.id !== deficit.stockpile.id,
                );
                if (validSources.length === 0) {
                    continue;
                }

                // Severity: how far below target as a ratio (1.0 = completely empty)
                const severity = deficit.deficit / deficit.preferred;

                // Proximity tie-break: distance to the source stockpile
                const nearestSource = validSources.reduce((best, s) => {
                    return distance(entity.worldPosition, s.stockpile.worldPosition) <
                        distance(entity.worldPosition, best.stockpile.worldPosition)
                        ? s
                        : best;
                });

                const proximityBonus =
                    1 /
                    (1 +
                        distance(
                            entity.worldPosition,
                            nearestSource.stockpile.worldPosition,
                        ));
                const score = severity + proximityBonus * 0.01;

                if (score > bestScore) {
                    bestScore = score;
                    bestDeficit = deficit;
                    bestSource = nearestSource;
                }
            }

            if (!bestDeficit || !bestSource) {
                return [];
            }

            const amount = Math.min(
                bestSource.surplus,
                bestDeficit.deficit,
                WORKER_INVENTORY_CAPACITY,
            );

            return [
                {
                    type: "moveTo",
                    target: bestSource.stockpile.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "withdrawFromStockpile",
                    stockpileId: bestSource.stockpile.id,
                    itemId: bestDeficit.itemId,
                    amount,
                },
                {
                    type: "moveTo",
                    target: bestDeficit.stockpile.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "depositToStockpile",
                    stockpileId: bestDeficit.stockpile.id,
                },
            ];
        },
    };
}
