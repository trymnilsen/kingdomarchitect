import type { Job } from "./job.ts";

export const FarmHarvestJobId = "farmHarvestJob" as const;

export interface FarmHarvestJob extends Job {
    id: typeof FarmHarvestJobId;
    targetBuilding: string;
}

export function createFarmHarvestJob(buildingId: string): FarmHarvestJob {
    return {
        id: FarmHarvestJobId,
        targetBuilding: buildingId,
    };
}
