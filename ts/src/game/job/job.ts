import type { Entity } from "../entity/entity.ts";
import type { AttackJob } from "./attackJob.ts";
import type { BuildBuildingJob } from "./buildBuildingJob.ts";
import type { CollectItemJob } from "./collectItemJob.ts";
import type { CollectResourceJob } from "./collectResourceJob.ts";
import type { CraftingJob } from "./craftingJob.ts";
import type { MoveToJob } from "./moveToPointJob.ts";
import type { ProductionJob } from "./productionJob.ts";

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
    | AttackJob
    | CollectItemJob
    | CollectResourceJob
    | CraftingJob
    | ProductionJob;
export type JobId = Jobs["id"];

export function isTargetOfJob(job: Jobs, entity: Entity): boolean {
    switch (job.id) {
        case "attackJob":
            return job.target == entity.id;
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
        case "moveToJob":
            return false;
    }
}

/**
 * Check if a job is claimed by any worker.
 */
export function isJobClaimed(job: Job): boolean {
    return job.claimedBy !== undefined;
}
