import type { GoapActionDefinition } from "../../../goap/goapAction.ts";

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

    preconditions: () => true, // Always possible

    createExecutionData: () => ({
        duration: 5000, // Idle for 5 seconds
    }),

    execute: (_data, _ctx) => {
        // Idle action has no state changes - just exists to provide a default behavior
        // Animation system would handle playing idle animations based on agent state
        // TODO: Get agent component to check elapsed time
        // For now, complete immediately to maintain test compatibility
        return "complete";
    },

    postActionDelay: () => 3000, // 3 second pause after idling
};
