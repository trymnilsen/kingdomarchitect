import { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import { getBehaviorAgent } from "../../component/BehaviorAgentComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Behavior } from "./Behavior.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import { findFreeAdjacentTile } from "../dropItem.ts";
import { planEquipCommand } from "../planners/equipCommandPlanner.ts";
import { planEquipFromHeld } from "../planners/equipFromHeldPlanner.ts";

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

                case "attack": {
                    const root = entity.getRootEntity();
                    const target = root.findEntity(command.targetEntityId);
                    if (!target) {
                        agent.playerCommand = undefined;
                        entity.invalidateComponent("behavioragent");
                        return [];
                    }
                    return [
                        {
                            type: "moveTo",
                            target: target.worldPosition,
                            stopAdjacent: "cardinal",
                        },
                        { type: "attackTarget", targetId: command.targetEntityId },
                        { type: "clearPlayerCommand" },
                    ];
                }

                case "pickup": {
                    const root = entity.getRootEntity();
                    const target = root.findEntity(command.targetEntityId);
                    if (!target) {
                        agent.playerCommand = undefined;
                        entity.invalidateComponent("behavioragent");
                        return [];
                    }
                    return [
                        {
                            type: "moveTo",
                            target: target.worldPosition,
                            stopAdjacent: "cardinal",
                        },
                        {
                            type: "pickupFromGround",
                            pileEntityId: command.targetEntityId,
                        },
                        { type: "clearPlayerCommand" },
                    ];
                }

                case "drop": {
                    const held = entity.getEcsComponent(HeldItemComponentId);
                    if (!held || isHeldEmpty(held)) {
                        agent.playerCommand = undefined;
                        entity.invalidateComponent("behavioragent");
                        return [];
                    }
                    const root = entity.getRootEntity();
                    const adjacent = findFreeAdjacentTile(
                        root,
                        entity.worldPosition,
                        held.item!,
                    );
                    if (!adjacent) {
                        log.warn(
                            `Drop failed for ${entity.id}: no free adjacent tile`,
                        );
                        agent.playerCommand = undefined;
                        entity.invalidateComponent("behavioragent");
                        return [];
                    }
                    return [
                        { type: "moveTo", target: adjacent },
                        { type: "dropHeld", destination: adjacent },
                        { type: "clearPlayerCommand" },
                    ];
                }

                case "equip": {
                    const root = entity.getRootEntity();
                    const plan = planEquipCommand(root, entity, {
                        sourceEntityId: command.sourceEntityId,
                        itemId: command.itemId,
                        slot: command.slot,
                    });
                    if (plan.length === 0) {
                        agent.playerCommand = undefined;
                        entity.invalidateComponent("behavioragent");
                        return [];
                    }
                    return plan;
                }

                case "equipFromHeld": {
                    const held = entity.getEcsComponent(HeldItemComponentId);
                    if (!held || isHeldEmpty(held)) {
                        agent.playerCommand = undefined;
                        entity.invalidateComponent("behavioragent");
                        return [];
                    }
                    const root = entity.getRootEntity();
                    return planEquipFromHeld(root, entity, command.slot);
                }

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
