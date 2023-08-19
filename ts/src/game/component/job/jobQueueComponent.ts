import { removeItem } from "../../../common/array.js";
import { Event, EventListener } from "../../../common/event.js";
import { Point } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { Job } from "../../job/job.js";
import { EntityComponent } from "../entityComponent.js";
import { JobOwner } from "./jobOwner.js";
import { JobQueue } from "./jobQueue.js";

/**
 * The job queue components holds a list of pending jobs that are not run
 * yet. It draws any pending jobs and handles canceling them while they are
 * still pending. To avoid circular dependencies, the queue is not responsible
 * for scheduling the jobs to new runners/actors. Runners will still explicitly
 * take jobs for the queue. Once a job is added an event is send and the
 * JobSchedulerComponent will look for available runners.
 */
export class JobQueueComponent
    extends EntityComponent
    implements JobQueue, JobOwner
{
    override fromBundle(bundle: {}): void {
        throw new Error("Method not implemented.");
    }
    override toBundle(): {} {
        throw new Error("Method not implemented.");
    }
    private _pendingJobs: Job[] = [];
    private _jobScheduledEvent: Event<Job> = new Event<Job>();

    get pendingJobs(): Job[] {
        return this._pendingJobs;
    }

    get jobScheduledEvent(): EventListener<Job> {
        return this._jobScheduledEvent;
    }

    addJob(job: Job): void {
        this._pendingJobs.push(job);
        job.owner = this;
        this._jobScheduledEvent.publish(job);
    }

    removeJob(job: Job): void {
        const removeResult = removeItem(this._pendingJobs, job);
        if (!removeResult) {
            console.warn("Job not removed, was not in list", job);
        }
    }

    onAbort(job: Job): void {
        this.removeJob(job);
    }

    onComplete(job: Job): void {
        this.removeJob(job);
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        for (const pendingJob of this._pendingJobs) {
            pendingJob.onDraw(context);
        }
    }
}
