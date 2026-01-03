import { GoapAgentComponentId } from "../../../component/goapAgentComponent.ts";
import { entityWithId } from "../../../entity/child/withId.ts";
import type { GoapGoalDefinition } from "../../../goap/goapGoal.ts";
import { getState } from "../../../goap/goapWorldState.ts";

/**
 * Idle goal - the fallback goal when no other goals are valid.
 * This ensures agents always have something to do.
 */
export const idleGoal: GoapGoalDefinition = {
    id: "idle",
    name: "Idle",
    priority: 1, // Lowest priority - only chosen when nothing else applies

    isValid: () => true, // Always valid as a fallback

    isSatisfied: (ctx) => {
        // Check if we've idled recently in the real world
        // This matches the planning-time check in wouldBeSatisfiedBy
        const agent = entityWithId(ctx.root, ctx.agentId);
        if (!agent) {
            return false;
        }

        const goapAgent = agent.getEcsComponent(GoapAgentComponentId);
        if (!goapAgent) {
            return false;
        }

        // If we're currently executing an idle action, check how long we've been doing it
        const timeSinceActionStart = ctx.tick - goapAgent.currentActionStartTick;
        const isCurrentlyIdle =
            goapAgent.currentPlan?.goalId === "idle" &&
            goapAgent.currentStepIndex < (goapAgent.currentPlan?.steps.length || 0);

        if (isCurrentlyIdle) {
            // Still satisfied if we've been idling for less than 5 seconds
            const idleDuration = 5000;
            return timeSinceActionStart < idleDuration;
        }

        return false;
    },

    wouldBeSatisfiedBy: (state, ctx) => {
        // Idle is satisfied if we've idled recently (within the last 5 seconds)
        // This makes idle a time-limited goal - after idling, the goal is satisfied
        // for a period, then becomes unsatisfied again, triggering re-planning
        const lastIdleTime = parseInt(getState(state, "lastIdleTime") || "0");
        const timeSinceIdle = ctx.tick - lastIdleTime;
        const idleDuration = 5000; // 5 seconds
        return timeSinceIdle < idleDuration;
    },
};
