import type { Jobs } from "../job/job.js";

export type JobRunnerComponent = {
    id: typeof JobRunnerComponentId;
    currentJob: Jobs | null;
};

export function createJobRunnerComponent(): JobRunnerComponent {
    return {
        id: JobRunnerComponentId,
        currentJob: null,
    };
}

export const JobRunnerComponentId = "JobRunner";
