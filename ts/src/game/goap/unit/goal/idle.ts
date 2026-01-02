import type { GoapGoalDefinition } from "../../../goap/goapGoal.ts";

/**
 * Idle goal - the fallback goal when no other goals are valid.
 * This ensures agents always have something to do.
 */
export const idleGoal: GoapGoalDefinition = {
    id: "idle",
    name: "Idle",
    priority: 1, // Lowest priority - only chosen when nothing else applies

    isValid: () => true, // Always valid as a fallback

    isSatisfied: () => false, // Never satisfied - continuous behavior

    relevantActions: ["idle"],
};
