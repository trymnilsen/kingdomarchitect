export type Phase = "dawn" | "day" | "dusk" | "night";

export type DayComponent = {
    id: typeof DayComponentId;
    phase: Phase;
    currentDay: number;
    daysSurvived: number;
};

export const DayComponentId = "day";

export function createDayComponent(): DayComponent {
    return {
        id: DayComponentId,
        phase: "dawn",
        currentDay: 1,
        daysSurvived: 0,
    };
}

export const DAWN_TICKS = 60;
export const DAY_TICKS = 60;
export const DUSK_TICKS = 60;
export const NIGHT_TICKS = 60;
export const TOTAL_CYCLE_TICKS = DAWN_TICKS + DAY_TICKS + DUSK_TICKS + NIGHT_TICKS;

// Tunable background colour per phase.
const PHASE_COLORS: Record<Phase, string> = {
    dawn: "#0f1420",
    day: "#003214",
    dusk: "#231608",
    night: "#0a001e",
};

/** Returns the background canvas colour for the given phase. */
export function phaseBackgroundColor(phase: Phase): string {
    return PHASE_COLORS[phase];
}

/**
 * Derives phase, currentDay, and daysSurvived purely from the tick counter.
 * Safe to call on both server and client with the same tick value.
 */
export function derivePhaseState(tick: number): {
    phase: Phase;
    currentDay: number;
    daysSurvived: number;
} {
    const daysSurvived = Math.floor(tick / TOTAL_CYCLE_TICKS);
    const cyclePos = tick % TOTAL_CYCLE_TICKS;

    let phase: Phase;
    if (cyclePos < DAWN_TICKS) {
        phase = "dawn";
    } else if (cyclePos < DAWN_TICKS + DAY_TICKS) {
        phase = "day";
    } else if (cyclePos < DAWN_TICKS + DAY_TICKS + DUSK_TICKS) {
        phase = "dusk";
    } else {
        phase = "night";
    }

    return { phase, currentDay: daysSurvived + 1, daysSurvived };
}
