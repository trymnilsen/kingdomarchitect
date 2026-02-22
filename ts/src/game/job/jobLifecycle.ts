import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type { Jobs } from "./job.ts";

/**
 * Find the job claimed by a specific entity.
 * Returns null if no job is claimed by this entity.
 * @param queueEntity The entity holding the JobQueueComponent
 */
export function findJobClaimedBy(
    queueEntity: Entity,
    entityId: string,
): Jobs | null {
    const jobQueue = queueEntity.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) return null;

    return jobQueue.jobs.find((job) => job.claimedBy === entityId) ?? null;
}

/**
 * Complete a job and remove it from the queue.
 * Call this when a job has been successfully finished.
 * @param queueEntity The entity holding the JobQueueComponent
 */
export function completeJobFromQueue(queueEntity: Entity, job: Jobs): void {
    const jobQueue = queueEntity.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) return;

    const index = jobQueue.jobs.indexOf(job);
    if (index !== -1) {
        jobQueue.jobs.splice(index, 1);
        queueEntity.invalidateComponent(JobQueueComponentId);
    }
}

/**
 * Fail a job and remove it from the queue.
 * Call this when a job cannot be completed (e.g., target destroyed).
 * @param queueEntity The entity holding the JobQueueComponent
 */
export function failJobFromQueue(queueEntity: Entity, job: Jobs): void {
    const jobQueue = queueEntity.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) return;

    const index = jobQueue.jobs.indexOf(job);
    if (index !== -1) {
        jobQueue.jobs.splice(index, 1);
        queueEntity.invalidateComponent(JobQueueComponentId);
    }
}

/**
 * Suspend a job by releasing the claim.
 * The job remains in the queue and can be claimed by another worker.
 * Call this when a job cannot proceed temporarily (e.g., missing materials).
 * @param queueEntity The entity holding the JobQueueComponent
 */
export function suspendJobInQueue(queueEntity: Entity, job: Jobs): void {
    job.claimedBy = undefined;
    queueEntity.invalidateComponent(JobQueueComponentId);
}

/**
 * Claim a job for a worker.
 * Sets claimedBy to mark this worker as the owner.
 * @param queueEntity The entity holding the JobQueueComponent
 */
export function claimJobInQueue(
    job: Jobs,
    workerId: string,
    queueEntity: Entity,
): void {
    job.claimedBy = workerId;
    queueEntity.invalidateComponent(JobQueueComponentId);
}
