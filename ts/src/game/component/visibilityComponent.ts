/**
 * Marks an entity as a viewer and stores how far it can see, as a base reach
 * radius in tiles. The actual sight diamond is derived from this radius on read
 * (plus the modifier stack) rather than baked into a stored pattern, so a future
 * modifier — equipment, traits, a vantage bonus — can change reach without
 * rebuilding any stored geometry. See {@link visionReachRadius}.
 *
 * Reach is the maximum distance this viewer can see before illumination is
 * considered; what the player ends up actually seeing is the smaller of reach and
 * the tile's light band.
 */
export type VisibilityComponent = {
    id: typeof VisibilityComponentId;
    baseReach: number;
};

export function createVisibilityComponent(
    baseReach: number,
): VisibilityComponent {
    return {
        id: VisibilityComponentId,
        baseReach,
    };
}

export const VisibilityComponentId = "visibility";
