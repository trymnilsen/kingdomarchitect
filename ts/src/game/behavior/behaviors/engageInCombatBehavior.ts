import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    getTopThreat,
    ThreatMapComponentId,
} from "../../component/threatMapComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Behavior } from "./Behavior.ts";

/**
 * EngageInCombatBehavior makes an entity fight back against whoever is
 * accumulating the most threat against it. Activates whenever the threat
 * map has at least one live attacker entry. Sits just below player
 * commands so that direct player intent (e.g. "attack G1") is not
 * preempted by an opportunistic hit from another enemy.
 */
export function createEngageInCombatBehavior(): Behavior {
    return {
        name: "engageInCombat",

        isValid(entity: Entity): boolean {
            const threat = entity.getEcsComponent(ThreatMapComponentId);
            if (!threat) {
                return false;
            }
            const topId = getTopThreat(threat);
            if (!topId) {
                return false;
            }
            return entity.getRootEntity().findEntity(topId) !== null;
        },

        utility(_entity: Entity): number {
            return 90;
        },

        expand(entity: Entity): BehaviorActionData[] {
            const threat = entity.getEcsComponent(ThreatMapComponentId);
            if (!threat) {
                return [];
            }
            const topId = getTopThreat(threat);
            if (!topId) {
                return [];
            }
            const attacker = entity.getRootEntity().findEntity(topId);
            if (!attacker) {
                return [];
            }

            const actions: BehaviorActionData[] = [];
            // Skip the moveTo when already adjacent so reconcileQueue can
            // reuse the running attackTarget action across replans instead
            // of resetting it every tick.
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
