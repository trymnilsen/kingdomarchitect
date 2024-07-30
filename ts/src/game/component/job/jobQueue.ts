import { EventListener } from "../../../common/event.js";
import { Job } from "./job.js";
import { JobConstraint } from "./jobConstraint.js";

export type JobQueue = {
    /**
     * Retrieve a list of pending jobs
     */
    readonly pendingJobs: Job[];
    readonly jobScheduledEvent: EventListener<Job>;
    /**
     * Add a new job to the queue
     * @param job the job to add
     */
    addJob(job: Job): void;
    /**
     * Removes the job from the queue
     * @param job the job to remove
     */
    removeJob(job: Job): void;
};
