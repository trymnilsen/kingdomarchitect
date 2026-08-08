/**
 * Marker component for goblin camp entities.
 * The camp entity acts as a parent/container for all camp buildings and goblins.
 */
export type GoblinCampComponent = {
    id: typeof GoblinCampComponentId;

    /** Maximum number of goblins this camp can support */
    maxPopulation: number;
    /**
     * Kingdom score this camp waits for before its next raid. 0 means it has not
     * been seeded yet; formGoblinRaid seeds it on the camp's first evaluation,
     * since the seed depends on where the camp ended up relative to the kingdom.
     */
    nextRaidThreshold: number;
};

export const GoblinCampComponentId = "GoblinCamp";

/**
 * Create a new goblin camp component.
 */
export function createGoblinCampComponent(
    maxPopulation: number = 5,
): GoblinCampComponent {
    return {
        id: GoblinCampComponentId,
        maxPopulation,
        nextRaidThreshold: 0,
    };
}
