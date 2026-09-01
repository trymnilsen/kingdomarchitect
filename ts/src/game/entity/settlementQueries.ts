import { GoblinCampComponentId } from "../component/goblinCampComponent.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import { PlayerKingdomComponentId } from "../component/playerKingdomComponent.ts";
import { StockpileComponentId } from "../component/stockpileComponent.ts";
import type { Entity } from "./entity.ts";

/**
 * Walks up the ancestor chain to find the nearest settlement entity, either
 * a PlayerKingdom or a GoblinCamp. Returns that entity so queries
 * (stockpiles, housing, jobs) are scoped to the owning settlement rather
 * than the entire world tree.
 *
 * Falls back to the world root if no settlement ancestor is found.
 */
export function getSettlementEntity(entity: Entity): Entity {
    let current = entity.parent;
    while (current) {
        if (
            current.hasComponent(PlayerKingdomComponentId) ||
            current.hasComponent(GoblinCampComponentId)
        ) {
            return current;
        }
        current = current.parent;
    }
    return entity.getRootEntity();
}

/**
 * Every stockpile in the settlement that can actually hold something.
 *
 * This is a settlement query rather than a material one. It lives here because
 * both the material planner and the special-requirement check need it, and
 * having one import the other made those two modules mutually dependent.
 */
export function findStockpiles(settlement: Entity): Entity[] {
    const stockpiles: Entity[] = [];
    const stockpileComponents =
        settlement.queryComponents(StockpileComponentId);

    for (const [entity] of stockpileComponents) {
        if (entity.getEcsComponent(InventoryComponentId)) {
            stockpiles.push(entity);
        }
    }

    return stockpiles;
}
