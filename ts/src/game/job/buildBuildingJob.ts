import { isPointAdjacentTo } from "../../common/point.js";
import { BuildingComponentId } from "../component/buildingComponent.js";
import { heal, HealthComponentId } from "../component/healthComponent.js";
import { SpriteComponentId } from "../component/spriteComponent.js";
import type { Entity } from "../entity/entity.js";
import { completeJob, type Job, type JobHandler } from "./job.js";
import { doMovement, MovementResult } from "./movementHelper.js";

export interface BuildBuildingJob extends Job {
    id: typeof BuildBuildingJobId;
    entityId: string;
}

export function BuildBuildingJob(entity: Entity): BuildBuildingJob {
    return {
        id: BuildBuildingJobId,
        entityId: entity.id,
    };
}

export const BuildBuildingJobId = "buildBuildingJob";

export const buildBuildingHandler: JobHandler<BuildBuildingJob> = (
    entity,
    job,
) => {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(job.entityId);
    const buildingComponent =
        buildingEntity?.getEcsComponent(BuildingComponentId);

    if (!buildingEntity) {
        throw new Error(`Unable to find entity with entityId ${job.entityId}`);
    }

    if (!buildingComponent) {
        throw new Error(`No building component on entity ${job.entityId}`);
    }

    if (isPointAdjacentTo(buildingEntity.worldPosition, entity.worldPosition)) {
        const healthComponent =
            buildingEntity.requireEcsComponent(HealthComponentId);
        heal(healthComponent, 10);
        buildingEntity.invalidateComponent(HealthComponentId);
        if (healthComponent.currentHp >= healthComponent.maxHp) {
            const spriteComponent =
                buildingEntity.getEcsComponent(SpriteComponentId);

            if (!!spriteComponent) {
                spriteComponent.sprite = buildingComponent.building.icon;
            }
            buildingEntity.invalidateComponent(SpriteComponentId);
            completeJob(entity);
        }
    } else {
        const movement = doMovement(entity, buildingEntity.worldPosition);
        if (movement == MovementResult.Failure) {
            completeJob(entity);
        }
    }
};
