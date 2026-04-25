import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import { damage, HealthComponentId } from "../../component/healthComponent.ts";

const log = createLogger("behavior");
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./Action.ts";
import {
    addThreat,
    ThreatMapComponentId,
} from "../../component/threatMapComponent.ts";
import { createAttackGameEvent } from "../../entity/event/attackGameEventData.ts";

export type AttackTargetActionData = { type: "attackTarget"; targetId: string };

/**
 * Attack a target entity by dealing damage.
 * Progress is derived from target's HealthComponent - complete when hp <= 0.
 * Assumes worker is already adjacent to target (moveTo should have run first).
 */
export function executeAttackTargetAction(
    action: AttackTargetActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const root = entity.getRootEntity();
    const targetEntity = root.findEntity(action.targetId);

    if (!targetEntity) {
        log.warn(`Target entity ${action.targetId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.targetId },
        };
    }

    if (!isPointAdjacentTo(targetEntity.worldPosition, entity.worldPosition)) {
        log.warn(`Worker not adjacent to target`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const healthComponent = targetEntity.getEcsComponent(HealthComponentId);
    if (!healthComponent) {
        log.warn(`Target ${action.targetId} has no HealthComponent`);
        return { kind: "failed", cause: { type: "unknown" } };
    }
    const damageAmount = 1;
    damage(healthComponent, damageAmount);
    //TODO: add to threat map
    const threatmap = targetEntity.getEcsComponent(ThreatMapComponentId);
    if (threatmap) {
        addThreat(threatmap, entity.id, damageAmount, tick);
    }
    //TODO: trigger replan
    //TODO: Make engage in combat behavior, dependent on threat existing
    //TODO: in expand of engage: lazy update threat, select target
    targetEntity.invalidateComponent(HealthComponentId);
    entity.bubbleEvent(
        createAttackGameEvent(entity, entity.id, action.targetId),
    );

    if (healthComponent.currentHp <= 0) {
        return ActionComplete;
    }

    return ActionRunning;
}
