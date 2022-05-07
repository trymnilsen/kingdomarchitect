import { Event, EventListener } from "../../../common/event";
import { Actors } from "../../entity/actors";
import { World } from "../../world";
import { Actor } from "../actor";
import { Job } from "./job";

/**
 * A queue of jobs that are waiting to be performed
 */
export class JobQueue {
    private _pendingJobs: Job[] = [];
    private _jobScheduled = new Event<void>();

    public get pendingJobs(): Job[] {
        return this._pendingJobs;
    }

    public get jobScheduledEvent(): EventListener<void> {
        return this._jobScheduled;
    }

    /**
     * Schedule a new job
     * @param job the job to be performed
     */
    schedule(job: Job) {
        this._pendingJobs.push(job);
        this._jobScheduled.publish();
    }
}
