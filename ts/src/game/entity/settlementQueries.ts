import { GoblinCampComponentId } from "../component/goblinCampComponent.ts";
import { PlayerKingdomComponentId } from "../component/playerKingdomComponent.ts";
import type { Entity } from "./entity.ts";

/**
 * Walks up the ancestor chain to find the nearest settlement entity —
 * either a PlayerKingdom or a GoblinCamp. Returns that entity so queries
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
