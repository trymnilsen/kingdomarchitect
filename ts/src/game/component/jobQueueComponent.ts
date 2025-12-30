import type { Jobs } from "../job/job.ts";

export type JobQueueComponent = {
    id: typeof JobQueueComponentId;
    jobs: Jobs[];
};

export function createJobQueueComponent(): JobQueueComponent {
    return {
        id: JobQueueComponentId,
        jobs: [],
    };
}

export const JobQueueComponentId = "JobQueue";
