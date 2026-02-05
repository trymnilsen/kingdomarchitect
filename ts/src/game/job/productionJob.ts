import { generateId } from "../../common/idGenerator.ts";
import type { JobQueueComponent } from "../component/jobQueueComponent.ts";
import type { Job } from "./job.ts";

export interface ProductionJob extends Job {
    id: typeof ProductionJobId;
    /** The production building entity */
    targetBuilding: string;
    /** Progress counter (ticks spent working) */
    progress: number;
}

export function createProductionJob(targetBuilding: string): ProductionJob {
    return {
        id: ProductionJobId,
        state: "pending",
        targetBuilding,
        progress: 0,
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
 * Clear pending production jobs for a building (keeps claimed jobs)
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
                job.state !== "claimed"
            ),
    );
}
