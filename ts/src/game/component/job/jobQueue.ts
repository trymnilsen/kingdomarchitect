import { EventListener } from "../../../common/event.js";
import { Job } from "./job.js";
import { JobConstraint } from "./jobConstraint.js";
import { ScheduledJob } from "./scheduledJob.js";

export type JobQueue = {
    /**
     * Retrieve a list of pending jobs
     */
    readonly pendingJobs: ScheduledJob[];
    readonly jobScheduledEvent: EventListener<ScheduledJob>;
    /**
     * Add a new job to the queue
     * @param job the job to add
     */
    addJob(job: Job, constraint?: JobConstraint): void;
    /**
     * Removes the job from the queue
     * @param job the job to remove
     */
    removeJob(job: Job): void;
}
