import type { JobId } from "../../../game/job/job.ts";

export type ClearBuildingJobsCommand = {
    id: typeof ClearBuildingJobsCommandId;
    jobTypeId: JobId;
    buildingId: string;
};

export function ClearBuildingJobsCommand(
    jobTypeId: JobId,
    buildingId: string,
): ClearBuildingJobsCommand {
    return {
        id: ClearBuildingJobsCommandId,
        jobTypeId,
        buildingId,
    };
}

export const ClearBuildingJobsCommandId = "clearBuildingJobs";
