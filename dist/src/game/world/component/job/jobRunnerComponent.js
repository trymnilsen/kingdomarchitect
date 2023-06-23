function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { InvalidStateError } from "../../../../common/error/invalidStateError.js";
import { EntityComponent } from "../entityComponent.js";
import { JobQueueComponent } from "./jobQueueComponent.js";
export class JobRunnerComponent extends EntityComponent {
    get activeJob() {
        return this._activeJob;
    }
    get hasActiveJob() {
        return !!this._activeJob;
    }
    assignJob(job) {
        if (!this.entity) {
            throw new InvalidStateError("Cannot assign job to runner without entity");
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
    onAbort(job) {
        this.endJob();
    }
    onComplete(job) {
        this.endJob();
    }
    onStart(tick) {
        super.onStart(tick);
        // Request a job
        this.requestNewJob();
    }
    onUpdate(tick) {
        if (!!this._activeJob) {
            this._activeJob.update(tick);
        }
    }
    onDraw(context, screenPosition) {
        if (!!this._activeJob) {
            this._activeJob.onDraw(context);
        }
    }
    endJob() {
        this._activeJob = undefined;
        this.requestNewJob();
    }
    requestNewJob() {
        console.log("requestNewJob", this);
        const entity = this.entity;
        if (!entity) {
            console.error("Unable to request job, JobRunnerComponent has no entity");
            return;
        }
        const queue = entity.getAncestorComponent(JobQueueComponent);
        if (!queue) {
            console.error("Unable to request job, no queue found in ancestors");
            return;
        }
        const applicableJobs = queue.pendingJobs.filter((job)=>{
            return job.constraint?.isEntityApplicableForJob(job, entity);
        });
        if (applicableJobs.length > 0) {
            const mostApplicableJob = applicableJobs[0];
            // Remove the job from the queue to avoid it being assigned
            // to some other entity as well
            queue.removeJob(mostApplicableJob);
            this.assignJob(mostApplicableJob);
        } else {
            console.log("No applicable job found", entity, applicableJobs, queue.pendingJobs);
        }
    }
    constructor(...args){
        super(...args);
        /**
     * Jobs can be interupted and paused while running
     * To enable resuming jobs we keep them in a stack
     */ _define_property(this, "jobStack", []);
        _define_property(this, "_activeJob", void 0);
    }
}
