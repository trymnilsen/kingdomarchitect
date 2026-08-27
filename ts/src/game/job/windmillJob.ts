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
