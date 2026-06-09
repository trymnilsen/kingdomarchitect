import type { Entity } from "../entity/entity.ts";

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
