/**
 * The night searchlight on a manned station. Only meaningful at night while a worker
 * is on the tile; dormant otherwise.
 *
 * `searchlight` is the player-set aim mode: `auto` (sweep N→E→S→W, locking onto a
 * caught hostile) or a fixed cardinal. `beamAim` is the currently-lit quarter the
 * `WatchSystem` resolves each tick. `lockedOn` is a *transient* target the auto-sweep
 * is following; it is re-validated (and cleared if the target is gone or out of range)
 * by the WatchSystem every tick, so it cannot get stuck pointing at a dead entity.
 */
export type Cardinal = "N" | "E" | "S" | "W";
export type SearchlightMode = "auto" | Cardinal;

export type WatchComponent = {
    id: typeof WatchComponentId;
    searchlight: SearchlightMode;
    beamAim: Cardinal;
    lockedOn: string | null;
};

export function createWatchComponent(): WatchComponent {
    return {
        id: WatchComponentId,
        searchlight: "auto",
        beamAim: "N",
        lockedOn: null,
    };
}

export const WatchComponentId = "watch";
