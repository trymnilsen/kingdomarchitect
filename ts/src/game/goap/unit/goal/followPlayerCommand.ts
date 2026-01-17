import { GoapAgentComponentId } from "../../../component/goapAgentComponent.ts";
import type { GoapGoalDefinition } from "../../goapGoal.ts";
import { getState } from "../../goapWorldState.ts";

/**
 * Follow player command goal - execute direct player orders.
 * This goal has the highest priority to ensure player commands are
 * executed immediately, interrupting any ongoing autonomous behavior.
 *
 * The goal becomes valid when a player command is pending and is satisfied
 * when the command has been executed and cleared by the corresponding action.
 */
export const followPlayerCommandGoal: GoapGoalDefinition = {
    id: "follow_player_command",
    name: "Follow Player Command",

    /**
     * Highest priority (50) - player commands override everything.
     * Even overrides critical hunger (40) because the player is in control.
     *
     * This ensures that when a player right-clicks to move a unit,
     * it happens immediately regardless of what the unit was doing.
     */
    priority: () => 50,

    isValid: (ctx) => {
        // Goal is valid when there's a pending player command
        const goapAgent = ctx.agent.getEcsComponent(GoapAgentComponentId);
        if (!goapAgent) {
            return false;
        }

        // Check if there's a player command pending
        return !!goapAgent.playerCommand;
    },

    isSatisfied: (ctx) => {
        // Goal is never satisfied in runtime if a command exists
        // (this would make it invalid instead)
        // The action will clear the command when complete
        const goapAgent = ctx.agent.getEcsComponent(GoapAgentComponentId);
        if (!goapAgent || !goapAgent.playerCommand) {
            return true; // No command = satisfied
        }

        return false; // Command exists = not satisfied yet
    },

    wouldBeSatisfiedBy: (state, _ctx) => {
        // In the simulated world state during planning:
        // The goal is satisfied when the command has been marked as cleared.
        //
        // We use "cleared" sentinel to indicate:
        // - undefined/missing: no command (goal invalid)
        // - "pending": command exists but not executed yet
        // - "cleared": command was executed (goal satisfied)
        const commandState = getState(state, "playerCommand");
        return commandState === "cleared";
    },
};
