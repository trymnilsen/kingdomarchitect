import { InvalidStateError } from "../../../common/error/invalidStateError";
import { Job, JobState } from "./job";

export abstract class MultipleStepJob extends Job {
    private jobs: Job[] = [];

    update(tick: number): void {
        const job = this.jobs[0];
        if (job) {
            job.update(tick);
        }
    }

    setJobs(subJobs: Job[]): void {
        if (subJobs.length == 0) {
            throw new Error("Empty list of jobs provided");
        }
        if (this.jobState != JobState.NotStarted) {
            throw new InvalidStateError(
                "Cannot set sub jobs after the hosting job has started"
            );
        }
        this.jobs = subJobs;
        const firstJob = this.jobs[0];
        this.runJob(firstJob);
    }

    private runJob(subJob: Job) {
        subJob.jobState = JobState.Running;
        subJob.actor = this.actor;
        subJob.onStart();
        // Listen to completion on the subJob
        subJob.completedEvent.listenOnce(() => {
            this.subJobCompleted();
        });
    }

    private subJobCompleted() {
        //Remove the top job from the list of jobs
        this.jobs.shift();
        const nextJob = this.jobs[0];
        if (nextJob) {
            this.runJob(nextJob);
        } else {
            console.log(
                "No jobs left in multiple step job, setting to completed"
            );
            this.complete();
        }
    }
}
