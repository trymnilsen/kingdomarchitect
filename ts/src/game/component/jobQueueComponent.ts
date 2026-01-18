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
 * Job will automatically start in "pending" state for worker notification.
 */
export function addJob(jobQueue: JobQueueComponent, job: Jobs): void {
    job.state = "pending"; // Enforce correct initial state
    jobQueue.jobs.push(job);
}

/**
 * Remove a job from the queue by ID.
 */
export function removeJob(jobQueue: JobQueueComponent, jobId: string): void {
    const index = jobQueue.jobs.findIndex(j => j.id === jobId);
    if (index !== -1) {
        jobQueue.jobs.splice(index, 1);
    }
}

export const JobQueueComponentId = "JobQueue";
