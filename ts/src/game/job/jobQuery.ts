import type { Point } from "../../common/point.ts";
import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { isTargetOfJob, type Jobs } from "./job.ts";

/**
 * Find the job a worker is currently performing by reading the live job queue.
 * This is derived state: it always reflects the authoritative claimedBy on the
 * queue, so callers never need to cache or invalidate a "current job" field.
 * Returns null if the worker holds no claimed job.
 */
export function getJobForWorker(worker: Entity): Jobs | null {
    const jobQueue = worker.getAncestorEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        return null;
    }

    return jobQueue.jobs.find((job) => job.claimedBy === worker.id) ?? null;
}

/**
 * Find every job whose target is the given entity, claimed or not. Used to show
 * who (if anyone) is assigned to an entity that is the target of queued work.
 */
export function getJobsTargetingEntity(entity: Entity): Jobs[] {
    const jobQueue = entity.getAncestorEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        return [];
    }

    return jobQueue.jobs.filter((job) => isTargetOfJob(job, entity));
}

/**
 * Get the target position for a job (the tile a worker must reach to perform it).
 * Returns null when the target entity no longer exists, which also marks the job
 * as stale for callers that gate on a reachable target.
 */
export function getJobTargetPosition(root: Entity, job: Jobs): Point | null {
    switch (job.id) {
        case "collectResource":
        case "collectItem":
        case "buildBuildingJob": {
            const entity = root.findEntity(job.entityId);
            return entity?.worldPosition ?? null;
        }
        case "craftingJob":
        case "productionJob":
        case "farmPlantJob":
        case "windmillJob":
        case "farmHarvestJob": {
            const entity = root.findEntity(job.targetBuilding);
            return entity?.worldPosition ?? null;
        }
        case "moveToJob": {
            return job.position;
        }
        default:
            return null;
    }
}
