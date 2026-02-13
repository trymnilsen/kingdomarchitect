import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type { Jobs } from "./job.ts";

/**
 * Find the job claimed by a specific entity.
 * Returns null if no job is claimed by this entity.
 */
export function findJobClaimedBy(root: Entity, entityId: string): Jobs | null {
    const jobQueue = root.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) return null;

    return jobQueue.jobs.find((job) => job.claimedBy === entityId) ?? null;
}

/**
 * Complete a job and remove it from the queue.
 * Call this when a job has been successfully finished.
 */
export function completeJobFromQueue(root: Entity, job: Jobs): void {
    const jobQueue = root.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) return;

    const index = jobQueue.jobs.indexOf(job);
    if (index !== -1) {
        jobQueue.jobs.splice(index, 1);
        root.invalidateComponent(JobQueueComponentId);
    }
}

/**
 * Fail a job and remove it from the queue.
 * Call this when a job cannot be completed (e.g., target destroyed).
 */
export function failJobFromQueue(root: Entity, job: Jobs): void {
    const jobQueue = root.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) return;

    const index = jobQueue.jobs.indexOf(job);
    if (index !== -1) {
        jobQueue.jobs.splice(index, 1);
        root.invalidateComponent(JobQueueComponentId);
    }
}

/**
 * Suspend a job by releasing the claim.
 * The job remains in the queue and can be claimed by another worker.
 * Call this when a job cannot proceed temporarily (e.g., missing materials).
 */
export function suspendJobInQueue(root: Entity, job: Jobs): void {
    job.claimedBy = undefined;
    root.invalidateComponent(JobQueueComponentId);
}

/**
 * Claim a job for a worker.
 * Sets claimedBy to mark this worker as the owner.
 */
export function claimJobInQueue(
    job: Jobs,
    workerId: string,
    root: Entity,
): void {
    job.claimedBy = workerId;
    root.invalidateComponent(JobQueueComponentId);
}
