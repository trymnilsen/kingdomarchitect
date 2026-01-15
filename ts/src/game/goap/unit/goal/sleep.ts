import { EnergyComponentId } from "../../../component/energyComponent.ts";
import type { GoapGoalDefinition } from "../../../goap/goapGoal.ts";
import { getState } from "../../../goap/goapWorldState.ts";

/**
 * Sleep goal - ensures the agent maintains energy levels by sleeping.
 * Important but less critical than food.
 */
export const sleepGoal: GoapGoalDefinition = {
    id: "sleep",
    name: "Sleep",

    /**
     * Dynamic priority based on energy level.
     * - Energy 30-100: Priority 0 (goal not valid)
     * - Energy 0-30: Priority 35 (critical, between food urgency levels)
     *
     * This ensures agents will sleep when exhausted but food is still higher priority
     * when both needs are critical.
     */
    priority: (ctx) => {
        if (!ctx.agent) {
            return 0;
        }
        const energy = ctx.agent.getEcsComponent(EnergyComponentId);
        if (!energy) {
            return 0;
        }

        const energyLevel = energy.energy;

        if (energyLevel >= 30) {
            return 0; // Not tired, goal not valid anyway
        } else {
            return 35; // Critical tiredness - need to sleep soon
        }
    },

    isValid: (ctx) => {
        if (!ctx.agent) {
            return false;
        }
        const energy = ctx.agent.getEcsComponent(EnergyComponentId);
        if (!energy) {
            return false;
        }
        // Goal becomes valid when tired
        return energy.energy < 30;
    },

    isSatisfied: (ctx) => {
        if (!ctx.agent) {
            return true;
        }
        const energy = ctx.agent.getEcsComponent(EnergyComponentId);
        if (!energy) {
            return true; // No energy component = no need to sleep
        }
        // Goal is satisfied when well rested
        return energy.energy > 70;
    },

    wouldBeSatisfiedBy: (state, _ctx) => {
        // Check if goal is satisfied in the simulated world state
        // This is used during A* search to determine when we've found a valid plan

        // Get energy from simulated state
        const energy = parseInt(getState(state, "energy") || "100");

        // Goal is satisfied when well rested (energy > 70)
        return energy > 70;
    },
};
