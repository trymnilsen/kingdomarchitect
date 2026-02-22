/**
 * Marker component for goblin camp entities.
 * The camp entity acts as a parent/container for all camp buildings and goblins.
 */
export type GoblinCampComponent = {
    id: typeof GoblinCampComponentId;

    /** Maximum number of goblins this camp can support */
    maxPopulation: number;
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
    };
}
