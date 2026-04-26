import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    damageEntity,
    HealthComponentId,
} from "../../component/healthComponent.ts";

const log = createLogger("behavior");
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./Action.ts";
import {
    addThreat,
    getTopThreat,
    ThreatMapComponentId,
} from "../../component/threatMapComponent.ts";
import { requestReplan } from "../../component/BehaviorAgentComponent.ts";
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
    const threatmap = targetEntity.getEcsComponent(ThreatMapComponentId);
    if (threatmap) {
        const topBefore = getTopThreat(threatmap);
        addThreat(threatmap, entity.id, damageAmount, tick);
        const topAfter = getTopThreat(threatmap);
        if (topBefore !== topAfter) {
            requestReplan(targetEntity);
        }
    }
    entity.bubbleEvent(
        createAttackGameEvent(entity, entity.id, action.targetId),
    );

    damageEntity(targetEntity, damageAmount, tick);

    if (healthComponent.currentHp <= 0) {
        return ActionComplete;
    }

    return ActionRunning;
}
