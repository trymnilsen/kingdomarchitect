import type { Entity } from "../entity/entity.ts";
import { PlayerUnitComponentId } from "./playerUnitComponent.ts";

/**
 * Marker component for the player kingdom entity.
 * The kingdom entity acts as the hierarchical boundary for all player
 * buildings and workers, mirroring the GoblinCampComponent pattern.
 */
export type PlayerKingdomComponent = {
    id: typeof PlayerKingdomComponentId;
};

export const PlayerKingdomComponentId = "PlayerKingdom";

export function createPlayerKingdomComponent(): PlayerKingdomComponent {
    return {
        id: PlayerKingdomComponentId,
    };
}

/**
 * Returns the player kingdom entity from the world root, or undefined if none
 * exists.
 */
export function findPlayerKingdom(root: Entity): Entity | undefined {
    const results = root.queryComponents(PlayerKingdomComponentId);
    for (const [entity] of results) {
        return entity;
    }
    return undefined;
}

/**
 * Number of living player workers (PlayerUnit entities) in the world. Drives
 * goblin-camp scaling and the raid trigger (see goblinRaid / goblinCampSystem).
 * Counted globally rather than per-kingdom: the game has a single player kingdom
 * and the raid system already targets player buildings world-wide. PlayerUnit is
 * workers-only (goblins use GoblinUnitComponent), so this never counts enemies.
 */
export function countPlayerWorkers(root: Entity): number {
    return root.queryComponents(PlayerUnitComponentId).size;
}
