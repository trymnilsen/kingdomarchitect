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

/**
 * Add a new job to the queue.
 */
export function addJob(jobQueue: JobQueueComponent, job: Jobs): void {
    jobQueue.jobs.push(job);
}

/**
 * Move an existing job to the front of the queue so it is worked next.
 * No-op if the job is not in the queue or is already at the front.
 */
export function moveJobToFront(jobQueue: JobQueueComponent, job: Jobs): void {
    const index = jobQueue.jobs.indexOf(job);
    if (index > 0) {
        jobQueue.jobs.splice(index, 1);
        jobQueue.jobs.unshift(job);
    }
}

/**
 * Remove a job from the queue by ID.
 */
export function removeJob(jobQueue: JobQueueComponent, jobId: string): void {
    const index = jobQueue.jobs.findIndex((j) => j.id === jobId);
    if (index !== -1) {
        jobQueue.jobs.splice(index, 1);
    }
}

export const JobQueueComponentId = "JobQueue";
