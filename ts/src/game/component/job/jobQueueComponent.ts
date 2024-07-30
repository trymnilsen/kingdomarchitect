import { Event, EventListener } from "../../../common/event.js";
import { Point } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { Entity } from "../../entity/entity.js";
import { EntityComponent } from "../entityComponent.js";
import { Job } from "./job.js";
import { JobConstraint } from "./jobConstraint.js";
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
    private _pendingJobs: Job[] = [];
    private _jobScheduledEvent: Event<Job> = new Event<Job>();

    get pendingJobs(): Job[] {
        return this._pendingJobs;
    }

    get jobScheduledEvent(): EventListener<Job> {
        return this._jobScheduledEvent;
    }

    addJob(job: Job): void {
        const scheduledJob = job;
        this._pendingJobs.push(scheduledJob);
        job.owner = this;
        this._jobScheduledEvent.publish(scheduledJob);
    }

    removeJob(job: Job): void {
        const filteredList = this._pendingJobs.filter((item) => {
            return item !== job;
        });

        const itemsRemoved = this._pendingJobs.length - filteredList.length;
        if (itemsRemoved == 0) {
            console.warn("Job not removed, was not in list", job);
        }

        if (itemsRemoved > 1) {
            console.warn("More than one item removed, this is probably a bug");
        }

        this._pendingJobs = filteredList;
    }

    getApplicableJob(entity: Entity): Job | null {
        if (this._pendingJobs.length == 0) {
            return null;
        }

        let mostApplicableJob: Job | null = null;
        let bestRank = 0;

        for (const job of this._pendingJobs) {
            const constraintRank = job.getConstraintRank(entity);
            if (constraintRank == 0) {
                continue;
            }

            if (constraintRank > bestRank) {
                bestRank = constraintRank;
                mostApplicableJob = job;
            }
        }

        return mostApplicableJob;
    }

    onReturnToQueue(): void {
        //No op for jobs already in the queue
    }
    onAbort(job: Job): void {
        this.removeJob(job);
    }

    onComplete(job: Job): void {
        this.removeJob(job);
    }

    override onDraw(context: RenderContext): void {
        for (const pendingJob of this._pendingJobs) {
            pendingJob.onDraw(context);
        }
    }
}
