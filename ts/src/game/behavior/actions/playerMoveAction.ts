import { pointEquals } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { doMovement, MovementResult } from "../../job/movementHelper.ts";
import { getBehaviorAgent } from "../../component/BehaviorAgentComponent.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Move to a target position for a player command.
 * Clears the player command when complete or failed.
 */
export function executePlayerMoveAction(
    action: Extract<BehaviorActionData, { type: "playerMove" }>,
    entity: Entity,
): ActionStatus {
    if (pointEquals(entity.worldPosition, action.target)) {
        const agent = getBehaviorAgent(entity);
        if (agent) {
            agent.playerCommand = undefined;
            entity.invalidateComponent("behavioragent");
        }
        console.log(
            `[PlayerMoveAction] Entity ${entity.id} reached target at ${action.target.x},${action.target.y}`,
        );
        return "complete";
    }

    const result = doMovement(entity, action.target);

    if (result === MovementResult.Failure) {
        console.warn(
            `[PlayerMoveAction] Entity ${entity.id} cannot reach target at ${action.target.x},${action.target.y}`,
        );
        const agent = getBehaviorAgent(entity);
        if (agent) {
            agent.playerCommand = undefined;
            entity.invalidateComponent("behavioragent");
        }
        return "failed";
    }

    if (pointEquals(entity.worldPosition, action.target)) {
        const agent = getBehaviorAgent(entity);
        if (agent) {
            agent.playerCommand = undefined;
            entity.invalidateComponent("behavioragent");
        }
        console.log(
            `[PlayerMoveAction] Entity ${entity.id} reached target at ${action.target.x},${action.target.y}`,
        );
        return "complete";
    }

    return "running";
}
