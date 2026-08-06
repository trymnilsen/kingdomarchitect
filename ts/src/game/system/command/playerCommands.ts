import { log } from "../../../common/logging/logger.ts";
import type { SetPlayerCommand } from "../../../server/message/command/setPlayerCommand.ts";
import {
    BehaviorAgentComponentId,
    requestReplan as requestBehaviorReplan,
} from "../../component/BehaviorAgentComponent.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * Hands a direct order to a single agent.
 *
 * The order is parked on the behavior agent and a replan is requested, so the
 * agent drops whatever it had planned and acts on the new instruction at its
 * next opportunity instead of finishing the current queue first.
 */
export function setPlayerCommand(root: Entity, command: SetPlayerCommand) {
    const agent = root.findEntity(command.agentId);
    if (!agent) {
        log.warn("Agent not found for SetPlayerCommand", {
            agentId: command.agentId,
        });
        return;
    }

    const behaviorAgent = agent.getEcsComponent(BehaviorAgentComponentId);
    if (!behaviorAgent) {
        log.warn("Agent has no BehaviorAgent component", {
            agentId: command.agentId,
        });
        return;
    }

    behaviorAgent.playerCommand = command.command;
    agent.invalidateComponent(BehaviorAgentComponentId);

    requestBehaviorReplan(agent);

    log.info("Command set for agent", {
        agentId: command.agentId,
        action: command.command.action,
    });
}
