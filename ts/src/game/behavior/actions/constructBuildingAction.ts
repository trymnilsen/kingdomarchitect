import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    BuildingComponentId,
} from "../../component/buildingComponent.ts";
import { heal, HealthComponentId } from "../../component/healthComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { finishConstruction } from "../../job/buildBuildingJob.ts";
import { findJobClaimedBy, completeJobFromQueue } from "../../job/jobLifecycle.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Construct a scaffolded building by healing its HealthComponent.
 * Progress is derived from HealthComponent.currentHp - complete when hp >= maxHp.
 * Assumes worker is already adjacent to building (moveTo should have run first).
 */
export function executeConstructBuildingAction(
    action: Extract<BehaviorActionData, { type: "constructBuilding" }>,
    entity: Entity,
): ActionStatus {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.entityId);

    if (!buildingEntity) {
        console.warn(
            `[ConstructBuilding] Building ${action.entityId} not found`,
        );
        return "failed";
    }

    if (!isPointAdjacentTo(buildingEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[ConstructBuilding] Worker not adjacent to building`);
        return "failed";
    }

    const buildingComponent = buildingEntity.getEcsComponent(BuildingComponentId);
    if (!buildingComponent) {
        console.warn(
            `[ConstructBuilding] Entity ${action.entityId} has no BuildingComponent`,
        );
        return "failed";
    }

    const healthComponent = buildingEntity.getEcsComponent(HealthComponentId);
    if (!healthComponent) {
        console.warn(
            `[ConstructBuilding] Building ${action.entityId} has no HealthComponent`,
        );
        return "failed";
    }

    heal(healthComponent, 10);
    buildingEntity.invalidateComponent(HealthComponentId);

    if (healthComponent.currentHp >= healthComponent.maxHp) {
        finishConstruction(root, buildingEntity, buildingComponent);
        const job = findJobClaimedBy(root, entity.id);
        if (job) {
            completeJobFromQueue(root, job);
        }
        return "complete";
    }

    return "running";
}
