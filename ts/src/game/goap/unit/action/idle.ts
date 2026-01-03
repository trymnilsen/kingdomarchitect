import type { GoapActionDefinition } from "../../../goap/goapAction.ts";
import { createWorldState, setState } from "../../../goap/goapWorldState.ts";

/**
 * Execution data for the idle action.
 */
export type IdleActionData = {
    /** Duration to idle in milliseconds */
    duration: number;
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

    createExecutionData: () => ({
        duration: 5000, // Idle for 5 seconds
    }),

    execute: () => {
        // Idle action has no state changes - just exists to provide a default behavior
        // Animation system would handle playing idle animations based on agent state
        // TODO: Get agent component to check elapsed time
        // For now, complete immediately to maintain test compatibility
        return "complete";
    },

    postActionDelay: () => 3000, // 3 second pause after idling
};
