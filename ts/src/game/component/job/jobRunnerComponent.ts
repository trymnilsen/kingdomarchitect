import { Point } from "../../../common/point.js";
import { jobDebug } from "../../../constants.js";
import { RenderScope } from "../../../rendering/renderContext.js";
import { EntityComponent } from "../entityComponent.js";
import { Job } from "./job.js";
import { JobOwner } from "./jobOwner.js";
import { JobQueueComponent } from "./jobQueueComponent.js";
import { JobState } from "./jobState.js";

export class JobRunnerComponent extends EntityComponent implements JobOwner {
    /**
     * Jobs can be interupted and paused while running
     * To enable resuming jobs we keep them in a stack
     */
    private jobStack: Job[] = [];
    private _isOpenForExternalJobs = true;

    get activeJob(): Job | undefined {
        return this.jobStack[this.jobStack.length - 1];
    }

    get hasActiveJob(): boolean {
        return !!this.activeJob;
    }

    get isOpenForExternalJobs(): boolean {
        return this._isOpenForExternalJobs;
    }

    set isOpenForExternalJobs(value: boolean) {
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
        const currentJob = this.activeJob;
        if (currentJob) {
            if (currentJob.isSuspendable) {
                try {
                    currentJob.onSuspend();
                } catch (e) {
                    //TODO: Abort the job if it fails to suspend
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
            job.jobState = JobState.Running;
            job.onStart();
        } catch (e) {
            console.error("Failed to start job", e, job);
            this.endJob();
        }
    }

    onReturnToQueue(): void {
        const currentJob = this.activeJob;
        this.endJob();
        if (currentJob) {
            this.entity
                .getAncestorComponent(JobQueueComponent)
                ?.addJob(currentJob);
        }
    }
    onAbort(): void {
        this.endJob();
    }
    onComplete(): void {
        this.endJob();
    }

    override onStart(tick: number): void {
        super.onStart(tick);
        // Request a job
        if (!this.activeJob) {
            this.requestNewJob();
        }
    }

    override onUpdate(tick: number): void {
        if (this.activeJob) {
            this.activeJob.update(tick);
        }
    }

    override onDraw(context: RenderScope): void {
        if (this.activeJob) {
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
        const entity = this.entity;
        if (!entity) {
            console.error(
                "Unable to request job, JobRunnerComponent has no entity",
            );
            return;
        }

        const queue = entity.getAncestorComponent(JobQueueComponent);
        if (!queue) {
            console.error("Unable to request job, no queue found in ancestors");
            return;
        }

        const applicableJob = queue.getApplicableJob(this.entity);
        if (!!applicableJob) {
            // Remove the job from the queue to avoid it being assigned
            // to some other entity as well
            queue.removeJob(applicableJob);
            this.assignJob(applicableJob);
        }
    }
}
