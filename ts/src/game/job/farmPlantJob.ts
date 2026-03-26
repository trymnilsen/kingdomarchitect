import type { Job } from "./job.ts";

export const FarmPlantJobId = "farmPlantJob" as const;

export interface FarmPlantJob extends Job {
    id: typeof FarmPlantJobId;
    targetBuilding: string;
}

export function createFarmPlantJob(buildingId: string): FarmPlantJob {
    return {
        id: FarmPlantJobId,
        targetBuilding: buildingId,
    };
}
