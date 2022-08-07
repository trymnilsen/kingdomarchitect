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
    private _jobScheduled = new Event<Job>();

    public get pendingJobs(): Job[] {
        return this._pendingJobs;
    }

    public get jobScheduledEvent(): EventListener<Job> {
        return this._jobScheduled;
    }

    /**
     * Schedule a new job
     * @param job the job to be performed
     */
    schedule(job: Job) {
        this._pendingJobs.push(job);
        this._jobScheduled.publish(job);
    }

    /**
     * Remove a job from the list of pending jobs because it has been consumed
     * @param job the job to remove
     */
    removeJob(job: Job) {
        const indexOfJob = this._pendingJobs.indexOf(job);
        if (indexOfJob >= 0) {
            this._pendingJobs.splice(indexOfJob, 1);
        } else {
            console.error(
                "Unable to remove job, it was not in list of pending"
            );
        }
    }
}
