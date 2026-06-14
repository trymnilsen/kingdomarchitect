import { InventoryComponentId } from "../component/inventoryComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";
import { findStockpiles } from "./materialQuery.ts";

/**
 * Which inventories an aggregated stock view reads from.
 *  - `single`: just the named entity (e.g. the stockpile or crafting building
 *    the player selected). Used for the dismissable "this building only" chip.
 *  - `allStockpiles`: every stockpile in the owning settlement — the
 *    kingdom-wide view you get by dismissing the scope chip.
 */
export type StockScope =
    | { kind: "single"; entityId: string }
    | { kind: "allStockpiles" };

/**
 * Resolve a scope to the concrete list of source entities to aggregate. The
 * settlement-wide case is gated on StockpileComponent (via findStockpiles), so
 * crafting buffers, held items and any debug root inventory are excluded — only
 * shared stockpile stock counts. Call this once per recompute; it performs the
 * single settlement query whose result the aggregate then sweeps.
 */
export function resolveStockSources(
    scope: StockScope,
    anchor: Entity,
): Entity[] {
    switch (scope.kind) {
        case "allStockpiles": {
            const settlement = getSettlementEntity(anchor);
            return findStockpiles(settlement);
        }
        case "single": {
            const entity = anchor.getRootEntity().findEntity(scope.entityId);
            if (entity && entity.getEcsComponent(InventoryComponentId)) {
                return [entity];
            }
            return [];
        }
    }
}
