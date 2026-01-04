import { HungerComponentId } from "../../../component/hungerComponent.ts";
import { entityWithId } from "../../../entity/child/withId.ts";
import type { GoapGoalDefinition } from "../../../goap/goapGoal.ts";
import { getState } from "../../../goap/goapWorldState.ts";

/**
 * Stay fed goal - ensures the agent maintains low hunger levels.
 * High priority survival need.
 */
export const stayFedGoal: GoapGoalDefinition = {
    id: "stay_fed",
    name: "Stay Fed",

    /**
     * Dynamic priority based on hunger level.
     * - Hunger 0-50: Priority 0 (goal not valid, so priority doesn't matter)
     * - Hunger 50-70: Priority 15 (moderate urgency, slightly below work)
     * - Hunger 70-85: Priority 25 (high urgency, overrides work)
     * - Hunger 85-100: Priority 40 (critical urgency, overrides everything)
     *
     * This ensures agents will work when only moderately hungry,
     * but will stop to eat when hunger becomes critical.
     */
    priority: (ctx) => {
        const agent = entityWithId(ctx.root, ctx.agentId);
        if (!agent) {
            return 0;
        }
        const hunger = agent.getEcsComponent(HungerComponentId);
        if (!hunger) {
            return 0;
        }

        const hungerLevel = hunger.hunger;

        if (hungerLevel < 50) {
            return 0; // Not hungry, goal not valid anyway
        } else if (hungerLevel < 70) {
            return 15; // Moderate hunger - can wait for work to finish
        } else if (hungerLevel < 85) {
            return 25; // High hunger - more important than work
        } else {
            return 40; // Critical hunger - drop everything and eat
        }
    },

    isValid: (ctx) => {
        const agent = entityWithId(ctx.root, ctx.agentId);
        if (!agent) {
            return false;
        }
        const hunger = agent.getEcsComponent(HungerComponentId);
        if (!hunger) {
            return false;
        }
        // Goal becomes valid when moderately hungry
        return hunger.hunger > 50;
    },

    isSatisfied: (ctx) => {
        const agent = entityWithId(ctx.root, ctx.agentId);
        if (!agent) {
            return true;
        }
        const hunger = agent.getEcsComponent(HungerComponentId);
        if (!hunger) {
            return true; // No hunger component = no need to eat
        }
        // Goal is satisfied when well fed
        return hunger.hunger < 30;
    },

    wouldBeSatisfiedBy: (state, _ctx) => {
        // Check if goal is satisfied in the simulated world state
        // This is used during A* search to determine when we've found a valid plan

        // Get hunger from simulated state
        const hunger = parseInt(getState(state, "hunger") || "100");

        // Goal is satisfied when well fed (hunger < 30)
        return hunger < 30;
    },
};
