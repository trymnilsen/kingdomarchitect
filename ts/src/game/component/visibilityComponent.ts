import type { LightBand } from "../light/lightBand.ts";

/**
 * The sight a viewer keeps even in total darkness: tiles within `radius`
 * (Manhattan, so radius 1 is the viewer's own tile plus the four cardinal
 * neighbours) are perceived at least at `band`, however dark the world is.
 *
 * This is a property of the viewer's senses, not of the world — the tiles are
 * *not* lit, and the illumination field never sees this. A worker feeling their
 * way through the night perceives their immediate surroundings without casting
 * any light other actors (or pathfinding) could react to.
 *
 * Readonly because instances are shared: every worker holds a reference to the
 * one WORKER_MINIMAL_PERCEPTION constant. Per-entity changes must replace the
 * whole object — or, better, land as a modifier in `minimalPerceptionOf` — never
 * mutate in place.
 */
export type MinimalPerception = {
    readonly radius: number;
    readonly band: LightBand;
};

/**
 * Marks an entity as a viewer and stores how far it can see, as a base reach
 * radius in tiles. The actual sight diamond is derived from this radius on read
 * (plus the modifier stack) rather than baked into a stored pattern, so a future
 * modifier — equipment, traits, a vantage bonus — can change reach without
 * rebuilding any stored geometry. See {@link visionReachRadius}.
 *
 * Reach is the maximum distance this viewer can see before illumination is
 * considered; what the player ends up actually seeing is the smaller of reach and
 * the tile's light band — except inside the viewer's {@link MinimalPerception},
 * which sets a floor that darkness cannot drop below.
 */
export type VisibilityComponent = {
    id: typeof VisibilityComponentId;
    baseReach: number;
    minimalPerception?: MinimalPerception;
};

export function createVisibilityComponent(
    baseReach: number,
    minimalPerception?: MinimalPerception,
): VisibilityComponent {
    return {
        id: VisibilityComponentId,
        baseReach,
        minimalPerception,
    };
}

export const VisibilityComponentId = "visibility";
