import { JobRunnerComponentId } from "../component/jobRunnerComponent.js";
import type { Entity } from "../entity/entity.js";
import type { AttackJob } from "./attackJob.js";
import type { BuildBuildingJob } from "./buildBuildingJob.js";
import type { CollectResourceJob } from "./collectResourceJob.js";
import type { MoveToJob } from "./moveToPointJob.js";

export type JobConstraint = EntityJobConstraint;
export interface EntityJobConstraint {
    type: "entity";
    id: string;
}

export interface Job {
    id: JobId;
    constraint?: JobConstraint;
}

export type Jobs =
    | MoveToJob
    | BuildBuildingJob
    | AttackJob
    | CollectResourceJob;
export type JobId = Jobs["id"];
export type JobHandler<T extends Job> = (
    scene: Entity,
    root: Entity,
    entity: Entity,
    job: T,
    tick: number,
) => void;

export function completeJob(entity: Entity) {
    const runner = entity.requireEcsComponent(JobRunnerComponentId);
    console.log("Completing job", runner.currentJob);
    runner.currentJob = null;
    entity.invalidateComponent(JobRunnerComponentId);
}

export function isTargetOfJob(job: Jobs, entity: Entity): boolean {
    switch (job.id) {
        case "attackJob":
            return job.target == entity.id;
        case "buildBuildingJob":
            return job.entityId == entity.id;
        case "chopTreeJob":
            return job.entityId == entity.id;
        case "moveToJob":
            return false;
    }
}
