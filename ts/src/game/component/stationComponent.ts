/**
 * Marks a building as exposing a single *station* — a post a worker stands on to
 * provide a passive, occupancy-driven effect (the stone tower's lookout/searchlight).
 *
 * The component holds ONLY the player-set `priority`. `Off` means inert (no guard
 * pull); otherwise a free guard takes the highest-priority enabled station.
 *
 * Deliberately stores no reference to the occupying worker: who is currently manning
 * a station is derived live from physical co-location (see {@link visionReachModifiers}
 * and the garrison behavior), so there is nothing to dangle when a worker dies or
 * despawns. The effect lives on the *worker* standing on the tile, not on the station.
 */
export type StationPriority =
    (typeof StationPriority)[keyof typeof StationPriority];
export const StationPriority = {
    Off: 0,
    Low: 1,
    Medium: 2,
    High: 3,
} as const;

export type StationComponent = {
    id: typeof StationComponentId;
    priority: StationPriority;
};

export function createStationComponent(): StationComponent {
    return {
        id: StationComponentId,
        priority: StationPriority.Off,
    };
}

export const StationComponentId = "station";
