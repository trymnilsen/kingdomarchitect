import type { CityPreviewState } from "./cityPreviewState.ts";

/**
 * Advance the city preview simulation by one tick.
 * Currently a stub — full planner and building placement logic
 * will be added as those systems are built.
 */
export function simulateTick(state: CityPreviewState): void {
    state.currentTick += 1;
    state.log.push(`[tick ${state.currentTick}] Simulated`);
}
