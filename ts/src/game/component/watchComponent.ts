/**
 * The searchlight on a manned station. The beam runs whenever the tower is
 * manned, in every phase: its lit claim is what matters to hearthlight, and
 * daylight only changes how it renders.
 *
 * `searchlight` is the player-set aim mode: `auto` (sweep N -> E -> S -> W) or
 * a fixed cardinal. `beamAim` is the currently-lit quarter the watch system
 * resolves each tick. The beam never tracks hostiles. Detection is the hearth
 * defense system's job, fed by the lit tiles the beam claims.
 */
export type Cardinal = "N" | "E" | "S" | "W";
export type SearchlightMode = "auto" | Cardinal;

export type WatchComponent = {
    id: typeof WatchComponentId;
    searchlight: SearchlightMode;
    beamAim: Cardinal;
};

export function createWatchComponent(): WatchComponent {
    return {
        id: WatchComponentId,
        searchlight: "auto",
        beamAim: "N",
    };
}

export const WatchComponentId = "watch";
