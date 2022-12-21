import { removeItem } from "../../../common/array";
import { Event, EventHandle, EventListener } from "../../../common/event";
import { Job } from "./job";

/**
 * A queue of jobs that are waiting to be performed
 */
export class JobQueue {
    private _pendingJobs: Job[] = [];
    private _abortListeners: AbortListener[] = [];
    private _jobScheduled = new Event<Job>();

    public get pendingJobs(): Job[] {
        return this._pendingJobs;
    }

    public get jobScheduledEvent(): EventListener<Job> {
        return this._jobScheduled;
    }

    /**
     * Schedule a new job
     * @param job the job to be performed
     */
    schedule(job: Job) {
        this._pendingJobs.push(job);
        //Listen for the job to be aborted while in the queue
        const handle = job.completedEvent.listen((completedResult) => {
            this._removeJob(job, false);
        });
        this._abortListeners.push({
            handle: handle,
            job: job,
        });
        this._jobScheduled.publish(job);
    }

    pop(): Job | null {
        if (this.pendingJobs.length > 0) {
            const first = this.pendingJobs[0];
            this._removeJob(first, true);
            return first;
        } else {
            console.log("Unable to pop queue, size was 0");
            return null;
        }
    }

    /**
     * Remove a job from the list of pending jobs because it has been consumed
     * @param job the job to remove
     */
    removeJob(job: Job) {
        this._removeJob(job, true);
    }

    _removeJob(job: Job, logErrorOnNonExistence: boolean) {
        const removedSuccessfuly = removeItem(this._pendingJobs, job);
        const abortListener = this._abortListeners.find(
            (listener) => listener.job === job
        );
        if (!!abortListener) {
            //Invoke the handler to remove the listener
            abortListener.handle();
            removeItem(this._abortListeners, abortListener);
        }

        if (!removedSuccessfuly && logErrorOnNonExistence) {
            console.error(
                "Unable to remove job, it was not in list of pending"
            );
        } else {
            console.log(
                `Removed job (success: ${removedSuccessfuly}) from queue: `,
                job
            );
        }
    }
}

interface AbortListener {
    handle: EventHandle;
    job: Job;
}
