import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { isTargetOfJob, type Jobs } from "./job.ts";

/**
 * Find all jobs across every settlement's job queue that target the given entity.
 * Job queues live on settlement entities (player kingdom, goblin camps), not on root.
 */
export function queryForJobsWithTarget(target: Entity): Jobs[] {
    const root = target.getRootEntity();
    const matching: Jobs[] = [];

    for (const [, jobQueue] of root.queryComponents(JobQueueComponentId)) {
        for (const job of jobQueue.jobs) {
            if (isTargetOfJob(job, target)) {
                matching.push(job);
            }
        }
    }

    return matching;
}
