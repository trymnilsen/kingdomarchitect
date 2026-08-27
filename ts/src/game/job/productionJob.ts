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
