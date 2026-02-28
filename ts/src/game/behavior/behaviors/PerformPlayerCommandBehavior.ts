import { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/Action.ts";
import { getBehaviorAgent } from "../../component/BehaviorAgentComponent.ts";
import type { Behavior } from "./Behavior.ts";
import { createLogger } from "../../../common/logging/logger.ts";

const log = createLogger("behavior");

/**
 * PerformPlayerCommandBehavior executes player-issued commands with high priority.
 * This behavior overrides all autonomous behaviors to ensure immediate response
 * to player input. Commands include move, attack, pickup, and interact.
 */
export function createPerformPlayerCommandBehavior(): Behavior {
    return {
        name: "performPlayerCommand",

        isValid(entity: Entity): boolean {
            const agent = getBehaviorAgent(entity);
            return agent !== null && agent.playerCommand !== undefined;
        },

        utility(_entity: Entity): number {
            // High priority (90) - player commands should override most autonomous behaviors
            // Only critical survival behaviors (95-100) should take precedence
            return 90;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const agent = getBehaviorAgent(entity);
            if (!agent || !agent.playerCommand) {
                return [];
            }

            const command = agent.playerCommand;

            switch (command.action) {
                case "move":
                    return [
                        { type: "moveTo", target: command.targetPosition },
                        { type: "clearPlayerCommand" },
                    ];

                case "attack":
                    // TODO: Implement attack action when combat system is available
                    log.warn(
                        `Attack command not yet implemented for entity ${entity.id}`,
                    );
                    agent.playerCommand = undefined;
                    entity.invalidateComponent("behavioragent");
                    return [];

                case "pickup":
                    // TODO: Implement pickup action when inventory interaction is available
                    log.warn(
                        `Pickup command not yet implemented for entity ${entity.id}`,
                    );
                    agent.playerCommand = undefined;
                    entity.invalidateComponent("behavioragent");
                    return [];

                case "interact":
                    // TODO: Implement interact action when interaction system is available
                    log.warn(
                        `Interact command not yet implemented for entity ${entity.id}`,
                    );
                    agent.playerCommand = undefined;
                    entity.invalidateComponent("behavioragent");
                    return [];

                default:
                    log.warn(
                        `Unknown player command action: ${(command as any).action}`,
                    );
                    agent.playerCommand = undefined;
                    entity.invalidateComponent("behavioragent");
                    return [];
            }
        },
    };
}
