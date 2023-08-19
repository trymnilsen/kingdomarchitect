import { Point } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { EntityComponent } from "../entityComponent.js";
import { Job } from "./job.js";
import { JobOwner } from "./jobOwner.js";
import { JobQueueComponent } from "./jobQueueComponent.js";

export class JobRunnerComponent extends EntityComponent implements JobOwner {
    override fromBundle(bundle: {}): void {
        throw new Error("Method not implemented.");
    }
    override toBundle(): {} {
        throw new Error("Method not implemented.");
    }
    /**
     * Jobs can be interupted and paused while running
     * To enable resuming jobs we keep them in a stack
     */
    private jobStack: Job[] = [];
    private _isOpenForExternalJobs = true;

    public get activeJob(): Job | undefined {
        return this.jobStack[this.jobStack.length - 1];
    }

    public get hasActiveJob(): boolean {
        return !!this.activeJob;
    }

    public get isOpenForExternalJobs(): boolean {
        return this._isOpenForExternalJobs;
    }

    public set isOpenForExternalJobs(value: boolean) {
        this._isOpenForExternalJobs = value;
    }

    /**
     * Assign a job to this runner. Any job currently running will be suspended
     * or aborted if it does not support suspending. If you want to
     * queue a job for a specific runner you should add it to the JobQueue
     * instead with a entityInstanceConstraint.
     * @param job
     */
    assignJob(job: Job): void {
        console.log("Assign job to runner:", job, this);

        const currentJob = this.activeJob;
        if (currentJob) {
            if (currentJob.isSuspendable) {
                try {
                    currentJob.onSuspend();
                } catch (e) {
                    //TODO: should we abort the job if it fails to suspend?
                    console.error("Failed to suspend job", e, currentJob);
                }
            } else {
                // The job was not resumable so we will remove it
                this.jobStack.pop();
            }
        }

        this.jobStack.push(job);
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
        if (!!this.activeJob) {
            this.activeJob.update(tick);
        }
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        if (!!this.activeJob) {
            this.activeJob.onDraw(context);
        }
    }

    private endJob() {
        this.jobStack.pop();
        if (this.jobStack.length == 0) {
            this.requestNewJob();
        } else {
            // Resume the job that was last suspended and below the job
            // that was popped in the job
            this.activeJob?.onResume();
        }
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
