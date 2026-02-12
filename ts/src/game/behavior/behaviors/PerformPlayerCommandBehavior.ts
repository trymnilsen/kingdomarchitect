import { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/Action.ts";
import { getBehaviorAgent } from "../../component/BehaviorAgentComponent.ts";
import type { Behavior } from "./Behavior.ts";

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
                        { type: "playerMove", target: command.targetPosition },
                    ];

                case "attack":
                    // TODO: Implement attack action when combat system is available
                    console.warn(
                        `[Behavior] Attack command not yet implemented for entity ${entity.id}`,
                    );
                    agent.playerCommand = undefined;
                    entity.invalidateComponent("behavioragent");
                    return [];

                case "pickup":
                    // TODO: Implement pickup action when inventory interaction is available
                    console.warn(
                        `[Behavior] Pickup command not yet implemented for entity ${entity.id}`,
                    );
                    agent.playerCommand = undefined;
                    entity.invalidateComponent("behavioragent");
                    return [];

                case "interact":
                    // TODO: Implement interact action when interaction system is available
                    console.warn(
                        `[Behavior] Interact command not yet implemented for entity ${entity.id}`,
                    );
                    agent.playerCommand = undefined;
                    entity.invalidateComponent("behavioragent");
                    return [];

                default:
                    console.warn(
                        `[Behavior] Unknown player command action: ${(command as any).action}`,
                    );
                    agent.playerCommand = undefined;
                    entity.invalidateComponent("behavioragent");
                    return [];
            }
        },
    };
}
