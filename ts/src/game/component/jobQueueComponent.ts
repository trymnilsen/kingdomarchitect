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

export function getJobById(jobQueue: JobQueueComponent, jobId: string): Jobs {
    const jobIndex = parseInt(jobId);
    const job = jobQueue.jobs[jobIndex];
    return job;
}

export const JobQueueComponentId = "JobQueue";
