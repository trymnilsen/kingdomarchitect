import { pointEquals, type Point } from "../../../../common/point.ts";
import { GoapAgentComponentId } from "../../../component/goapAgentComponent.ts";
import type {
    GoapActionDefinition,
    GoapActionExecutionResult,
} from "../../goapAction.ts";
import type { GoapContext } from "../../goapContext.ts";
import { createWorldState, setState } from "../../goapWorldState.ts";
import { doMovement, MovementResult } from "../../../job/movementHelper.ts";

/**
 * Execution data for player move command action.
 */
export type PlayerMoveCommandActionData = {
    targetPosition: Point;
};

/**
 * Player move command action - move to a position commanded by the player.
 * This is different from implicit movement within other actions because
 * the destination itself is the goal, not a means to another action.
 *
 * Only available when the player has issued a move command.
 */
export const playerMoveCommandAction: GoapActionDefinition<PlayerMoveCommandActionData> =
    {
        id: "player_move_command",
        name: "Move (Player Command)",

        getCost: (ctx) => {
            const goapAgent = ctx.agent.getEcsComponent(GoapAgentComponentId);
            if (
                !goapAgent?.playerCommand ||
                goapAgent.playerCommand.action !== "move"
            ) {
                return 1000; // High cost if wrong command type
            }

            // Cost = base + distance
            const target = goapAgent.playerCommand.targetPosition;
            const dx = target.x - ctx.agent.worldPosition.x;
            const dy = target.y - ctx.agent.worldPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return 5 + distance;
        },

        preconditions: (_state, ctx) => {
            // Precondition: must have a move command
            const goapAgent = ctx.agent.getEcsComponent(GoapAgentComponentId);
            return (
                !!goapAgent?.playerCommand &&
                goapAgent.playerCommand.action === "move"
            );
        },

        getEffects: (_state, _ctx) => {
            const effects = createWorldState();
            // Clears the player command
            setState(effects, "playerCommand", "cleared");
            return effects;
        },

        createExecutionData: (ctx) => {
            const goapAgent =
                ctx.agent.requireEcsComponent(GoapAgentComponentId);

            if (
                !goapAgent.playerCommand ||
                goapAgent.playerCommand.action !== "move"
            ) {
                throw new Error("No move command to execute");
            }

            return {
                targetPosition: goapAgent.playerCommand.targetPosition,
            };
        },

        execute: (data, ctx) => {
            const agentPosition = ctx.agent.worldPosition;

            // Check if we've reached the target
            if (pointEquals(agentPosition, data.targetPosition)) {
                clearPlayerCommand(ctx);
                console.log(
                    `[GOAP] Agent ${ctx.agent.id} completed move command to ${data.targetPosition.x},${data.targetPosition.y}`,
                );
                return "complete";
            }

            // Move towards target
            const result = doMovement(ctx.agent, data.targetPosition);

            if (result === MovementResult.Failure) {
                console.warn(
                    `[GOAP] Agent ${ctx.agent.id} cannot reach move target at ${data.targetPosition.x},${data.targetPosition.y}`,
                );
                clearPlayerCommand(ctx);
                return "complete";
            }

            return "in_progress";
        },

        postActionDelay: () => 0, // No delay after player commands
    };

/**
 * Clear the player command from the agent.
 */
function clearPlayerCommand(ctx: GoapContext): void {
    const goapAgent = ctx.agent.requireEcsComponent(GoapAgentComponentId);
    goapAgent.playerCommand = undefined;
    ctx.agent.invalidateComponent(GoapAgentComponentId);
}
