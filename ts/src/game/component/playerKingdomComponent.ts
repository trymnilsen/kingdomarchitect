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
