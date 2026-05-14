import type { Entity } from "../entity/entity.ts";
import {
    checkMaterialsAvailability,
    getRemainingMaterials,
    type BuildBuildingJob,
    type RemainingMaterials,
} from "./buildBuildingJob.ts";
import type { CollectItemJob } from "./collectItemJob.ts";
import type { CollectResourceJob } from "./collectResourceJob.ts";
import type { CraftingJob } from "./craftingJob.ts";
import type { MoveToJob } from "./moveToPointJob.ts";
import type { ProductionJob } from "./productionJob.ts";
import type { FarmPlantJob } from "./farmPlantJob.ts";
import type { FarmHarvestJob } from "./farmHarvestJob.ts";
import type { WindmillJob } from "./windmillJob.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";

export type JobConstraint = EntityJobConstraint;
export interface EntityJobConstraint {
    type: "entity";
    id: string;
}

export interface Job {
    id: JobId;
    claimedBy?: string;
    constraint?: JobConstraint;
}

export type Jobs =
    | MoveToJob
    | BuildBuildingJob
    | CollectItemJob
    | CollectResourceJob
    | CraftingJob
    | ProductionJob
    | FarmPlantJob
    | FarmHarvestJob
    | WindmillJob;
export type JobId = Jobs["id"];

export function isTargetOfJob(job: Jobs, entity: Entity): boolean {
    switch (job.id) {
        case "buildBuildingJob":
            return job.entityId == entity.id;
        case "collectResource":
            return job.entityId == entity.id;
        case "collectItem":
            return job.entityId == entity.id;
        case "craftingJob":
            return job.targetBuilding == entity.id;
        case "productionJob":
            return job.targetBuilding == entity.id;
        case "farmPlantJob":
            return job.targetBuilding == entity.id;
        case "farmHarvestJob":
            return job.targetBuilding == entity.id;
        case "windmillJob":
            return job.targetBuilding == entity.id;
        case "moveToJob":
            return false;
    }
}

/**
 * Check if the job is in a valid state. Some jobs might be queued, but not in a valid state where they can run.
 * An example is a build job where the requirements is not met
 * @param job the job to run
 * @param entity the entity that wants to run the job
 */
export function isJobValid(job: Jobs, entity: Entity): boolean {
    switch (job.id) {
        case "buildBuildingJob":
            return isBuildJobValid(job, entity);
        default:
            return true;
    }
}

function isBuildJobValid(job: BuildBuildingJob, entity: Entity): boolean {
    const building = entity.getRootEntity().findEntity(job.entityId);
    if (!building) {
        throw new Error(
            `Build building job has invalid entity: ${job.entityId}`,
        );
    }

    const requirements =
        building.requireEcsComponent(BuildingComponentId).building.requirements;

    if (!requirements) {
        return true;
    }

    const settlement = getSettlementEntity(entity);
    const availableMaterials = checkMaterialsAvailability(
        settlement,
        entity,
        requirements.materials as RemainingMaterials,
    );

    return availableMaterials.allAvailable;
}

/**
 * Check if a job is claimed by any worker.
 */
export function isJobClaimed(job: Job): boolean {
    return job.claimedBy !== undefined;
}
