import { JobRunnerComponentId } from "../component/jobRunnerComponent.js";
import type { Entity } from "../entity/entity.js";
import type { BuildBuildingJob } from "./buildBuildingJob.js";
import type { MoveToJob } from "./moveToPointJob.js";

export interface Job {
    id: JobId;
}

export type Jobs = MoveToJob | BuildBuildingJob;
export type JobId = Jobs["id"];
export type JobHandler<T extends Job> = (entity: Entity, job: T) => void;

export function completeJob(entity: Entity) {
    const runner = entity.requireEcsComponent(JobRunnerComponentId);
    console.log("Completing job", runner.currentJob);
    runner.currentJob = null;
    entity.invalidateComponent(JobRunnerComponentId);
}
