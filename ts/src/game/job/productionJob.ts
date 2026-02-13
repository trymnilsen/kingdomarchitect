import type { JobQueueComponent } from "../component/jobQueueComponent.ts";
import type { Job } from "./job.ts";

export interface ProductionJob extends Job {
    id: typeof ProductionJobId;
    /** The production building entity */
    targetBuilding: string;
}

export function createProductionJob(targetBuilding: string): ProductionJob {
    return {
        id: ProductionJobId,
        targetBuilding,
    };
}

export const ProductionJobId = "productionJob";

/**
 * Count production jobs targeting a specific building
 */
export function getProductionJobCountForBuilding(
    jobQueue: JobQueueComponent,
    buildingId: string,
): number {
    return jobQueue.jobs.filter(
        (job): job is ProductionJob =>
            job.id === ProductionJobId && job.targetBuilding === buildingId,
    ).length;
}

/**
 * Clear unclaimed production jobs for a building (keeps claimed jobs)
 */
export function clearProductionJobsForBuilding(
    jobQueue: JobQueueComponent,
    buildingId: string,
): void {
    jobQueue.jobs = jobQueue.jobs.filter(
        (job) =>
            !(
                job.id === ProductionJobId &&
                job.targetBuilding === buildingId &&
                job.claimedBy === undefined
            ),
    );
}
