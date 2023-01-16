import { InvalidStateError } from "../../../../common/error/invalidStateError";
import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { Job } from "../../actor/job/job";
import { EntityComponent } from "../entityComponent";
import { JobQueueComponent } from "./jobQueueComponent";

export class JobRunnerComponent extends EntityComponent {
    /**
     * Jobs can be interupted and paused while running
     * To enable resuming jobs we keep them in a stack
     */
    private jobStack: Job[] = [];
    private _activeJob?: Job;

    public get activeJob(): Job | undefined {
        return this._activeJob;
    }

    public get hasActiveJob(): Boolean {
        return !!this._activeJob;
    }

    override onStart(tick: number): void {
        super.onStart(tick);
        // Request a job
        this.requestNewJob();
    }

    public assignJob(job: Job): void {
        if (!this.entity) {
            throw new InvalidStateError(
                "Cannot assign job to runner without entity"
            );
        }
        console.log("Assign job to runner:", job, this);

        this._activeJob = job;
        job.entity = this.entity;
        try {
            job.onStart();
        } catch (e) {
            console.error("Failed to start job", e, job);
            this.endJob();
        }

        job.completedEvent.listenOnce((completeResult) => {
            this.endJob();
        });
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
        }
    }
}
