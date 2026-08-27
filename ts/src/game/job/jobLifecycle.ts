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
 * Take a job out of the queue for good, whether it finished or turned out to
 * be impossible. A job that leaves the queue is never re-selected, so both
 * outcomes end the same way.
 * @param queueEntity The entity holding the JobQueueComponent
 */
export function removeJobFromQueue(queueEntity: Entity, job: Jobs): void {
    const jobQueue = queueEntity.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) return;

    const index = jobQueue.jobs.indexOf(job);
    if (index !== -1) {
        jobQueue.jobs.splice(index, 1);
        queueEntity.invalidateComponent(JobQueueComponentId);
    }
}

/**
 * Complete the job currently claimed by `worker`, if any. Resolves the worker's
 * job queue from its ancestors, finds the job it claimed, and removes it. A
 * no-op when the worker has no queue or no claimed job. Job-fulfilling actions
 * call this on success so the finished job stops being re-selected.
 */
export function completeClaimedJob(worker: Entity): void {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (!queueEntity) {
        return;
    }
    const job = findJobClaimedBy(queueEntity, worker.id);
    if (job) {
        removeJobFromQueue(queueEntity, job);
    }
}

/**
 * Remove a job from whichever queue owns the worker. Planners and actions hold
 * the worker, not the queue, so they go through here instead of resolving the
 * ancestor queue themselves.
 */
export function removeJobForWorker(worker: Entity, job: Jobs): void {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        removeJobFromQueue(queueEntity, job);
    }
}

/**
 * Release the worker's claim on a job it cannot proceed with, leaving the job
 * queued for whoever can. See removeJobForWorker for why this takes the worker.
 */
export function suspendJobForWorker(worker: Entity, job: Jobs): void {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        suspendJobInQueue(queueEntity, job);
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
