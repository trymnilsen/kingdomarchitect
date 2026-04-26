import type { JobQueueComponent } from "../component/jobQueueComponent.ts";
import type { Job } from "./job.ts";

export interface WindmillJob extends Job {
    id: typeof WindmillJobId;
    /** The windmill building entity */
    targetBuilding: string;
}

export function createWindmillJob(targetBuilding: string): WindmillJob {
    return {
        id: WindmillJobId,
        targetBuilding,
    };
}

export const WindmillJobId = "windmillJob";

/**
 * Count windmill jobs targeting a specific building
 */
export function getWindmillJobCountForBuilding(
    jobQueue: JobQueueComponent,
    buildingId: string,
): number {
    return jobQueue.jobs.filter(
        (job): job is WindmillJob =>
            job.id === WindmillJobId && job.targetBuilding === buildingId,
    ).length;
}

/**
 * Clear unclaimed windmill jobs for a building (keeps claimed jobs)
 */
export function clearWindmillJobsForBuilding(
    jobQueue: JobQueueComponent,
    buildingId: string,
): void {
    jobQueue.jobs = jobQueue.jobs.filter(
        (job) =>
            !(
                job.id === WindmillJobId &&
                job.targetBuilding === buildingId &&
                job.claimedBy === undefined
            ),
    );
}
