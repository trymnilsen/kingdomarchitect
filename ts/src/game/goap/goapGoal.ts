import type { GoapContext } from "./goapAction.ts";

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
     */
    isValid: (ctx: GoapContext) => boolean;

    /**
     * Check if this goal is already satisfied.
     * Returns true if the desired end state is already achieved.
     * Agents won't plan for goals that are already satisfied.
     */
    isSatisfied: (ctx: GoapContext) => boolean;

    /**
     * List of action IDs that can satisfy this goal.
     * Used to filter which actions the planner considers.
     */
    relevantActions: string[];
}
