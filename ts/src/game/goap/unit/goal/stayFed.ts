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
    priority: 10, // High priority survival need

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
