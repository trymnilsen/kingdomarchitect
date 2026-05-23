export type TraversalComponent = {
    id: typeof TraversalComponentId;
    weight: number;
};

export const TraversalComponentId = "Traversal" as const;

/**
 * Tiles whose traversal weight is below this threshold are considered
 * passable by isTileAvailable and similar availability checks.
 * Weights at or above this value are treated as solid/impassable.
 */
export const TRAVERSAL_IMPASSABLE_THRESHOLD = 50;

export function createTraversalComponent(weight: number): TraversalComponent {
    return {
        id: TraversalComponentId,
        weight,
    };
}
