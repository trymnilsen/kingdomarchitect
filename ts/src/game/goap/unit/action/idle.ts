import type { GoapActionDefinition } from "../../../goap/goapAction.ts";
import { createWorldState, setState } from "../../../goap/goapWorldState.ts";

/**
 * Execution data for the idle action.
 */
export type IdleActionData = {
    /** Tick when idling started */
    startTick: number;
    /** Duration to idle in ticks (simulation runs at 1 Hz) */
    durationTicks: number;
};

/**
 * Idle action - stand around and do nothing.
 * This is the fallback behavior when no other actions are needed.
 */
export const idleAction: GoapActionDefinition<IdleActionData> = {
    id: "idle",
    name: "Stand Idle",

    getCost: () => 1,

    preconditions: () => {
        // Idle is always available in any state
        // It's the fallback action when nothing else can be done
        return true;
    },

    getEffects: (_state, ctx) => {
        // Idle updates the last idle time to current tick
        // This makes the idle goal satisfied for a period of time
        const effects = createWorldState();
        setState(effects, "lastIdleTime", ctx.tick.toString());
        return effects;
    },

    createExecutionData: (ctx) => ({
        startTick: ctx.tick,
        durationTicks: 10, // Idle for 10 ticks (10 seconds)
    }),

    execute: (data, ctx) => {
        // Check if enough time has elapsed
        const elapsedTicks = ctx.tick - data.startTick;

        if (elapsedTicks >= data.durationTicks) {
            // Idle duration complete
            return "complete";
        }

        // Still idling
        return "in_progress";
    },

    postActionDelay: () => 3000, // 3 second pause after idling
};
