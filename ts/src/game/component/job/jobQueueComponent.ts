import { Event, EventListener } from "../../../common/event.js";
import { Point } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { Entity } from "../../entity/entity.js";
import { EntityComponent } from "../entityComponent.js";
import { Job, JobBundle } from "./job.js";
import { JobConstraint, isJobApplicableForEntity } from "./jobConstraint.js";
import { createJobFromBundle } from "./jobLoader.js";
import { JobOwner } from "./jobOwner.js";
import { JobQueue } from "./jobQueue.js";
import { ScheduledJob } from "./scheduledJob.js";

type JobQueueBundle = {
    pendingJobs: {
        constraint?: JobConstraint;
        job: JobBundle;
    }[];
};

/**
 * The job queue components holds a list of pending jobs that are not run
 * yet. It draws any pending jobs and handles canceling them while they are
 * still pending. To avoid circular dependencies, the queue is not responsible
 * for scheduling the jobs to new runners/actors. Runners will still explicitly
 * take jobs for the queue. Once a job is added an event is send and the
 * JobSchedulerComponent will look for available runners.
 */
export class JobQueueComponent
    extends EntityComponent<JobQueueBundle>
    implements JobQueue, JobOwner
{
    private _pendingJobs: ScheduledJob[] = [];
    private _jobScheduledEvent: Event<ScheduledJob> = new Event<ScheduledJob>();

    get pendingJobs(): ScheduledJob[] {
        return this._pendingJobs;
    }

    get jobScheduledEvent(): EventListener<ScheduledJob> {
        return this._jobScheduledEvent;
    }

    addJob(job: Job, constraint?: JobConstraint): void {
        const scheduledJob = {
            job,
            constraint,
        };
        this._pendingJobs.push(scheduledJob);
        job.owner = this;
        this._jobScheduledEvent.publish(scheduledJob);
    }

    removeJob(job: Job): void {
        const filteredList = this._pendingJobs.filter((scheduledJob) => {
            return scheduledJob.job !== job;
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

    getApplicableJobs(entity: Entity): Job[] {
        return this._pendingJobs
            .filter((scheduledJob) => {
                if (!!scheduledJob.constraint) {
                    return isJobApplicableForEntity(
                        scheduledJob.job,
                        scheduledJob.constraint,
                        entity
                    );
                } else {
                    return true;
                }
            })
            .map((scheduledJob) => scheduledJob.job);
    }

    onAbort(job: Job): void {
        this.removeJob(job);
    }

    onComplete(job: Job): void {
        this.removeJob(job);
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        for (const pendingJob of this._pendingJobs) {
            pendingJob.job.onDraw(context);
        }
    }

    override fromComponentBundle(bundle: JobQueueBundle): void {
        this._pendingJobs = bundle.pendingJobs.map((jobQueueBundle) => {
            return {
                constraint: jobQueueBundle.constraint,
                job: createJobFromBundle(jobQueueBundle.job),
            };
        });
    }

    override toComponentBundle(): JobQueueBundle {
        return {
            pendingJobs: this._pendingJobs.map((scheduledJob) => {
                return {
                    job: scheduledJob.job.toJobBundle(),
                    constraint: scheduledJob.constraint,
                };
            }),
        };
    }
}
