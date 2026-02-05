import { JobRunnerComponentId } from "../component/jobRunnerComponent.ts";
import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
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
    | CraftingJob
    | ProductionJob;
export type JobId = Jobs["id"];
export type JobHandler<T extends Job> = (
    root: Entity,
    entity: Entity,
    job: T,
    tick: number,
) => void;

export function completeJob(entity: Entity, root?: Entity) {
    const runner = entity.requireEcsComponent(JobRunnerComponentId);
    const job = runner.currentJob;
    console.log("Completing job", job);

    // Remove job from global queue if root is provided
    if (root && job) {
        const jobQueue = root.getEcsComponent(JobQueueComponentId);
        if (jobQueue) {
            const index = jobQueue.jobs.indexOf(job);
            if (index !== -1) {
                jobQueue.jobs.splice(index, 1);
                root.invalidateComponent(JobQueueComponentId);
            }
        }
    }

    runner.currentJob = null;
    entity.invalidateComponent(JobRunnerComponentId);
}

/**
 * Suspend a job and return it to the queue.
 * Used when a job cannot proceed (e.g., missing materials).
 * The worker will release the job and trigger re-planning.
 */
export function suspendJob(entity: Entity, reason: string): void {
    const runner = entity.requireEcsComponent(JobRunnerComponentId);
    const job = runner.currentJob;

    if (job) {
        console.log(`[JOB] Suspending job ${job.id}: ${reason}`);
        // Reset job state so it can be claimed again
        job.state = "queued";
        job.claimedBy = undefined;
    }

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
