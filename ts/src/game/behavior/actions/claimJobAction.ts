import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { JobRunnerComponentId } from "../../component/jobRunnerComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { claimJob } from "../../job/job.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Claim a job from the queue.
 */
export function executeClaimJobAction(
    action: Extract<BehaviorActionData, { type: "claimJob" }>,
    entity: Entity,
): ActionStatus {
    const root = entity.getRootEntity();
    const runner = entity.getEcsComponent(JobRunnerComponentId);
    const jobQueue = root.getEcsComponent(JobQueueComponentId);

    if (!runner) {
        console.warn(
            `[ClaimJobAction] Entity ${entity.id} has no JobRunnerComponent`,
        );
        return "failed";
    }

    if (!jobQueue) {
        console.warn(`[ClaimJobAction] No job queue found on root entity`);
        return "failed";
    }

    const job = jobQueue.jobs[action.jobIndex];
    if (!job) {
        console.warn(
            `[ClaimJobAction] Job at index ${action.jobIndex} not found`,
        );
        return "failed";
    }

    // Check if job is already claimed by another worker
    if (job.state === "claimed" && job.claimedBy !== entity.id) {
        console.warn(
            `[ClaimJobAction] Job ${job.id} is already claimed by ${job.claimedBy}`,
        );
        return "failed";
    }

    claimJob(job, entity.id);
    runner.currentJob = job;
    entity.invalidateComponent(JobRunnerComponentId);
    root.invalidateComponent(JobQueueComponentId);

    console.log(
        `[ClaimJobAction] Entity ${entity.id} claimed job ${action.jobIndex} (${job.id})`,
    );

    return "complete";
}
