import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { isTargetOfJob, type Jobs } from "./job.ts";

export function queryForJobsWithTarget(target: Entity): Jobs[] {
    const root = target.getRootEntity();
    const jobQueue = root.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        throw new Error("No job queue on root entity for target");
    }

    return jobQueue.jobs.filter((job) => isTargetOfJob(job, target));
}
