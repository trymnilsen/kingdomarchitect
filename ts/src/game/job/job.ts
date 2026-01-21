import { JobRunnerComponentId } from "../component/jobRunnerComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type { AttackJob } from "./attackJob.ts";
import type { BuildBuildingJob } from "./buildBuildingJob.ts";
import type { CollectItemJob } from "./collectItemJob.ts";
import type { CollectResourceJob } from "./collectResourceJob.ts";
import type { CraftingJob } from "./craftingJob.ts";
import type { MoveToJob } from "./moveToPointJob.ts";

export type JobConstraint = EntityJobConstraint;
export interface EntityJobConstraint {
    type: "entity";
    id: string;
}

/**
 * Job lifecycle states for worker notification system.
 *
 * - pending: Job just added, workers need to be notified
 * - queued: Workers have been notified, waiting to be claimed
 * - claimed: A worker has claimed this job
 */
export type JobState = "pending" | "queued" | "claimed";

export interface Job {
    id: JobId;
    state: JobState;
    claimedBy?: string;
    constraint?: JobConstraint;
}

export type Jobs =
    | MoveToJob
    | BuildBuildingJob
    | AttackJob
    | CollectItemJob
    | CollectResourceJob
    | CraftingJob;
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
        case "collectResource":
            return job.entityId == entity.id;
        case "collectItem":
            return job.entityId == entity.id;
        case "craftingJob":
            return job.targetBuilding == entity.id;
        case "moveToJob":
            return false;
    }
}

/**
 * Check if a job is claimed by any worker.
 */
export function isJobClaimed(job: Job): boolean {
    return job.state === "claimed" || !!job.claimedBy;
}

/**
 * Mark a job as claimed by a worker.
 */
export function claimJob(job: Job, workerId: string): void {
    job.state = "claimed";
    job.claimedBy = workerId;
}

/**
 * Filter jobs by their state.
 */
export function getJobsByState(jobs: Jobs[], state: JobState): Jobs[] {
    return jobs.filter((job) => job.state === state);
}
