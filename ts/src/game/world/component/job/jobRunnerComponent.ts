import { InvalidStateError } from "../../../../common/error/invalidStateError.js";
import { Point } from "../../../../common/point.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { Job } from "../../job/job.js";
import { EntityComponent } from "../entityComponent.js";
import { JobOwner } from "./jobOwner.js";
import { JobQueueComponent } from "./jobQueueComponent.js";

export class JobRunnerComponent extends EntityComponent implements JobOwner {
    /**
     * Jobs can be interupted and paused while running
     * To enable resuming jobs we keep them in a stack
     */
    private jobStack: Job[] = [];
    private _activeJob?: Job;

    public get activeJob(): Job | undefined {
        return this._activeJob;
    }

    public get hasActiveJob(): boolean {
        return !!this._activeJob;
    }

    assignJob(job: Job): void {
        if (!this.entity) {
            throw new InvalidStateError(
                "Cannot assign job to runner without entity"
            );
        }
        console.log("Assign job to runner:", job, this);

        this._activeJob = job;
        job.entity = this.entity;
        job.owner = this;

        try {
            job.onStart();
        } catch (e) {
            console.error("Failed to start job", e, job);
            this.endJob();
        }
    }

    onAbort(job: Job): void {
        this.endJob();
    }
    onComplete(job: Job): void {
        this.endJob();
    }

    override onStart(tick: number): void {
        super.onStart(tick);
        // Request a job
        this.requestNewJob();
    }

    override onUpdate(tick: number): void {
        if (!!this._activeJob) {
            this._activeJob.update(tick);
        }
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        if (!!this._activeJob) {
            this._activeJob.onDraw(context);
        }
    }

    private endJob() {
        this._activeJob = undefined;
        this.requestNewJob();
    }

    private requestNewJob(): void {
        console.log("requestNewJob", this);
        const entity = this.entity;
        if (!entity) {
            console.error(
                "Unable to request job, JobRunnerComponent has no entity"
            );
            return;
        }

        const queue = entity.getAncestorComponent(JobQueueComponent);
        if (!queue) {
            console.error("Unable to request job, no queue found in ancestors");
            return;
        }

        const applicableJobs = queue.pendingJobs.filter((job) => {
            return job.constraint?.isEntityApplicableForJob(job, entity);
        });

        if (applicableJobs.length > 0) {
            const mostApplicableJob = applicableJobs[0];
            // Remove the job from the queue to avoid it being assigned
            // to some other entity as well
            queue.removeJob(mostApplicableJob);
            this.assignJob(mostApplicableJob);
        } else {
            console.log(
                "No applicable job found",
                entity,
                applicableJobs,
                queue.pendingJobs
            );
        }
    }
}
