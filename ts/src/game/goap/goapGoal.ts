import type { GoapContext } from "./goapContext.ts";
import type { GoapWorldState } from "./goapWorldState.ts";

/**
 * Defines a GOAP goal that an agent can pursue.
 * Goals have priorities and determine what the agent wants to achieve.
 */
export interface GoapGoalDefinition {
    /** Unique identifier for this goal */
    id: string;

    /** Human-readable name for debugging */
    name: string;

    /**
     * Priority of this goal. Higher values = more important.
     * Used to select which goal to pursue when multiple goals are valid.
     */
    priority: number;

    /**
     * Check if this goal should be considered for planning.
     * Returns false if the goal doesn't apply in the current situation.
     * This checks against the actual game world.
     */
    isValid: (ctx: GoapContext) => boolean;

    /**
     * Check if this goal is already satisfied in the actual game world.
     * Returns true if the desired end state is already achieved.
     * Agents won't plan for goals that are already satisfied.
     */
    isSatisfied: (ctx: GoapContext) => boolean;

    /**
     * Check if this goal would be satisfied in a simulated world state.
     * Used during A* search to determine when we've found a valid plan.
     *
     * @param state - The simulated world state to check against
     * @param ctx - The planning context
     */
    isSatisfiedInState: (state: GoapWorldState, ctx: GoapContext) => boolean;
}
