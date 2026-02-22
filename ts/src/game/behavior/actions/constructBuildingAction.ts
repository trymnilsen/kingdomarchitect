import { isPointAdjacentTo, pointEquals } from "../../../common/point.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { heal, HealthComponentId } from "../../component/healthComponent.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { finishConstruction } from "../../job/buildBuildingJob.ts";
import { findJobClaimedBy, completeJobFromQueue } from "../../job/jobLifecycle.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
    type BehaviorActionData,
} from "./Action.ts";

/**
 * Construct a scaffolded building by healing its HealthComponent.
 * Progress is derived from HealthComponent.currentHp - complete when hp >= maxHp.
 * Assumes worker is already adjacent to building (moveTo should have run first).
 */
export function executeConstructBuildingAction(
    action: Extract<BehaviorActionData, { type: "constructBuilding" }>,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.entityId);

    if (!buildingEntity) {
        console.warn(
            `[ConstructBuilding] Building ${action.entityId} not found`,
        );
        return { kind: "failed", cause: { type: "targetGone", entityId: action.entityId } };
    }

    if (
        !isPointAdjacentTo(buildingEntity.worldPosition, entity.worldPosition) &&
        !pointEquals(buildingEntity.worldPosition, entity.worldPosition)
    ) {
        console.warn(`[ConstructBuilding] Worker not adjacent to building`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const buildingComponent =
        buildingEntity.requireEcsComponent(BuildingComponentId);
    const healthComponent =
        buildingEntity.requireEcsComponent(HealthComponentId);

    heal(healthComponent, 10);
    buildingEntity.invalidateComponent(HealthComponentId);

    if (healthComponent.currentHp >= healthComponent.maxHp) {
        finishConstruction(root, buildingEntity, buildingComponent);
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
