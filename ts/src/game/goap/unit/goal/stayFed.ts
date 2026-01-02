import { HungerComponentId } from "../../../component/hungerComponent.ts";
import { entityWithId } from "../../../entity/child/withId.ts";
import type { GoapGoalDefinition } from "../../../goap/goapGoal.ts";

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

    relevantActions: ["eat_food"],
};
