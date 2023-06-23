import { EventListener } from "../../../../common/event.js";
import { Job } from "../../job/job.js";

export interface JobQueue {
    readonly pendingJobs: Job[];
    readonly jobScheduledEvent: EventListener<Job>;
    schedule(job: Job): void;
    removeJob(job: Job): void;
}
