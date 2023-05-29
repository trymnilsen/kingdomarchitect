import { EventListener } from "../../../../common/event";
import { Job } from "../../job/job";

export interface JobQueue {
    readonly pendingJobs: Job[];
    readonly jobScheduledEvent: EventListener<Job>;
    schedule(job: Job): void;
    removeJob(job: Job): void;
}
