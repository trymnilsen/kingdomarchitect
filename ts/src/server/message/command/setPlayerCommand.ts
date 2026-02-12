import type { PlayerCommand } from "../../../game/component/BehaviorAgentComponent.ts";

export type SetPlayerCommand = {
    id: typeof SetPlayerCommandId;
    /**
     * The entity id of the agent to receive the command
     */
    agentId: string;
    /**
     * The player command to set
     */
    command: PlayerCommand;
};

/**
 * Create a command to set a player command on agent.
 * This will trigger urgent replan and execute the command with highest priority.
 *
 * @param agentId - The ID of the entity to command
 * @param command - The player command to execute
 */
export function SetPlayerCommand(
    agentId: string,
    command: PlayerCommand,
): SetPlayerCommand {
    return {
        id: SetPlayerCommandId,
        agentId,
        command,
    };
}

export const SetPlayerCommandId = "setPlayerCommand";
