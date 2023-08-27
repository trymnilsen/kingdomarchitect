import { Job } from "./job.js";

export interface JobOwner {
    /**
     * Signal to the owner that the job has been aborted.
     * Do not use this to start aborting a job, use the method on the job
     * itself.
     * @param job
     */
    onAbort(job: Job): void;

    /**
     * Signal to the owner that the job has been completed.
     * Do not use this to start completing a job, use the method on the job
     * @param job
     */
    onComplete(job: Job): void;
}
