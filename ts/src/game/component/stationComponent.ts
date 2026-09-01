/**
 * Marks a building as exposing a single station, a post a worker stands on to
 * provide a passive effect while it is occupied (the stone tower's searchlight).
 *
 * The component holds only the player-set `priority`. `Off` means inert, with no
 * guard pull. Otherwise a free guard takes the highest-priority enabled station.
 *
 * Who is manning a station is derived from standing on its tile rather than
 * stored here, so nothing dangles when a worker dies or despawns. The effect
 * lives on the worker, not on the station.
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
