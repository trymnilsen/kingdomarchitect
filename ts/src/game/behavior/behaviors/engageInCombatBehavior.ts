import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    getTopThreat,
    ThreatMapComponentId,
} from "../../component/threatMapComponent.ts";
import { getGameTimeTick } from "../../component/gameTimeComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";

/**
 * Utility when the top threat is damage-sourced: someone is hitting this
 * entity. Self-defence preempts nearly everything. This ties player commands
 * at 90, and the tie resolves to the player command only because it precedes
 * this behavior in the resolver's array (the sort is stable). The hysteresis
 * bonus can keep an already-running engagement ahead of a fresh command, which
 * is the existing behavior and kept on purpose.
 */
const DAMAGE_UTILITY = 90;

/**
 * Utility when the top threat is only an intrusion sighting. Hunting a
 * trespasser yields to a critical task in progress, so this sits below player
 * commands and self-defence.
 */
const INTRUSION_UTILITY = 75;

/**
 * EngageInCombatBehavior makes an entity fight back against its most pressing
 * threat: whoever is hitting it, or failing that, an intruder sighted inside
 * hearthlight. Activates whenever the threat map has a live, undecayed entry.
 * Release needs no extra code: once refreshes and hits stop, the entry decays
 * out, isValid fails and the next replan frees the worker.
 */
export function createEngageInCombatBehavior(): Behavior {
    return {
        name: "engageInCombat",

        isValid(entity: Entity): boolean {
            const threat = entity.getEcsComponent(ThreatMapComponentId);
            if (!threat) {
                return false;
            }
            const root = entity.getRootEntity();
            // getTopThreat already skips unresolvable entries, so a non-empty
            // answer means a live target exists.
            return (
                getTopThreat(threat, getGameTimeTick(root), root) !== undefined
            );
        },

        utility(entity: Entity): number {
            const threat = entity.getEcsComponent(ThreatMapComponentId);
            if (!threat) {
                return 0;
            }
            const root = entity.getRootEntity();
            const topId = getTopThreat(threat, getGameTimeTick(root), root);
            if (!topId) {
                return 0;
            }
            if (threat.threat[topId]?.source === "damage") {
                return DAMAGE_UTILITY;
            }
            return INTRUSION_UTILITY;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const threat = entity.getEcsComponent(ThreatMapComponentId);
            if (!threat) {
                return [];
            }
            const root = entity.getRootEntity();
            const topId = getTopThreat(threat, getGameTimeTick(root), root);
            if (!topId) {
                return [];
            }
            const attacker = root.findEntity(topId);
            if (!attacker) {
                return [];
            }

            const actions: BehaviorActionData[] = [];
            // Skip the moveTo when already adjacent so the attack starts this
            // tick rather than routing through a no-op move.
            if (
                !isPointAdjacentTo(entity.worldPosition, attacker.worldPosition)
            ) {
                actions.push({
                    type: "moveTo",
                    target: attacker.worldPosition,
                    stopAdjacent: "cardinal",
                });
            }
            actions.push({ type: "attackTarget", targetId: topId });
            return actions;
        },
    };
}
