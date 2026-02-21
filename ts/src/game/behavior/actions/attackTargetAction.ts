import { isPointAdjacentTo } from "../../../common/point.ts";
import { damage, HealthComponentId } from "../../component/healthComponent.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { findJobClaimedBy, completeJobFromQueue } from "../../job/jobLifecycle.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
    type BehaviorActionData,
} from "./Action.ts";

/**
 * Attack a target entity by dealing damage.
 * Progress is derived from target's HealthComponent - complete when hp <= 0.
 * Assumes worker is already adjacent to target (moveTo should have run first).
 */
export function executeAttackTargetAction(
    action: Extract<BehaviorActionData, { type: "attackTarget" }>,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const targetEntity = root.findEntity(action.targetId);

    if (!targetEntity) {
        console.warn(
            `[AttackTarget] Target entity ${action.targetId} not found`,
        );
        return { kind: "failed", cause: { type: "targetGone", entityId: action.targetId } };
    }

    if (!isPointAdjacentTo(targetEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[AttackTarget] Worker not adjacent to target`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const healthComponent = targetEntity.getEcsComponent(HealthComponentId);
    if (!healthComponent) {
        console.warn(
            `[AttackTarget] Target ${action.targetId} has no HealthComponent`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    damage(healthComponent, 1);
    targetEntity.invalidateComponent(HealthComponentId);

    if (healthComponent.currentHp <= 0) {
        const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            const job = findJobClaimedBy(queueEntity, entity.id);
            if (job) {
                completeJobFromQueue(queueEntity, job);
            }
        }
        return ActionComplete;
    }

    return ActionRunning;
}
