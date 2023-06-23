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
import { InvalidStateError } from "../../../common/error/invalidStateError.js";
import { Job, JobState } from "./job.js";
/**
 * Represents a job that is able to hold a sequence of smaller child jobs.
 * Only the currently active job in the list of child jobs will be updated
 * until the child job considers itself finished.
 * Will finish once the last job in the sequence is finished
 */ export class MultipleStepJob extends Job {
    /**
     * Request to update the multiple set job. Will pass on the update to the
     * currently active job
     * @param tick
     */ update(tick) {
        const job = this.jobs[0];
        if (job) {
            if (job.startTick == 0) {
                job.startTick = tick;
            }
            job.update(tick);
        }
    }
    onDraw(renderContext) {
        const job = this.jobs[0];
        if (job) {
            job.onDraw(renderContext);
        }
    }
    /**
     * Set list of job that needs to complete for this job to be completed.
     * Needs to be called before the job has started.
     * Calling it in onStarted is OK.
     * @param subJobs list of jobs that makes up this job
     */ setJobs(subJobs) {
        if (subJobs.length == 0) {
            throw new Error("Empty list of jobs provided");
        }
        if (this.jobState != JobState.NotStarted) {
            throw new InvalidStateError("Cannot set sub jobs after the hosting job has started");
        }
        this.jobs = subJobs;
        const firstJob = this.jobs[0];
        this.runJob(firstJob);
    }
    onAbort(job) {
        console.error("Subjob aborted, aborting this job", job, this);
        this.complete();
    }
    onComplete(job) {
        console.log(`Multiple step job finished`, job, this.entity);
        this.subJobCompleted();
    }
    runJob(subJob) {
        console.log(`Starting multiple step job for entity`, subJob, this.entity);
        subJob.jobState = JobState.Running;
        subJob.entity = this.entity;
        subJob.owner = this;
        try {
            subJob.onStart();
        } catch (e) {
            console.error("Subjob failed to start, completing", e);
            this.complete();
        }
    }
    subJobCompleted() {
        //Remove the top job from the list of jobs
        this.jobs.shift();
        const nextJob = this.jobs[0];
        if (nextJob) {
            this.runJob(nextJob);
        } else {
            console.log("No jobs left in multiple step job, setting to completed");
            this.complete();
        }
    }
    constructor(...args){
        super(...args);
        _define_property(this, "jobs", []);
    }
}
