import { Event, EventListener } from "../../../common/event";
import { NotInitializedError } from "../../../common/error/notInitializedError";
import { Actor } from "../actor";
import { InvalidStateError } from "../../../common/error/invalidStateError";

export enum JobState {
    NotStarted,
    Running,
    Completed,
}

export abstract class Job {
    private _completedEvent = new Event<void>();
    private _actor: Actor | null = null;
    private _jobState: JobState = JobState.NotStarted;

    public get jobState(): JobState {
        return this._jobState;
    }

    public set jobState(v: JobState) {
        if (v == JobState.NotStarted) {
            throw new InvalidStateError(
                "Cannot set job state to not started, this the default state"
            );
        }

        if (this._jobState == JobState.Completed) {
            throw new InvalidStateError(
                `Job already completed, unable to change state to: ${v}`
            );
        }

        if (this._jobState == JobState.Running && v != JobState.Completed) {
            throw new InvalidStateError(
                `Can only transition to completed from running, attempted to set: ${v}`
            );
        }

        this._jobState = v;
    }

    /**
     * Event that is triggered when this job is completed
     */
    public get completedEvent(): EventListener<void> {
        return this._completedEvent;
    }

    /**
     * The actor this job is assigned to
     * Will throw if it is not set
     */
    public get actor(): Actor {
        if (this._actor) {
            return this._actor;
        } else {
            throw new NotInitializedError("actor");
        }
    }

    /**
     * Set the actor this job is assigned to
     */
    public set actor(actor: Actor) {
        this._actor = actor;
    }

    /**
     * Update this job
     * @param tick the game tick
     */
    abstract update(tick: number): void;

    /**
     * invoked when the job is started
     */
    onStart() {}

    /**
     * Signal that this job is completed and any actors performing it can
     * take on new jobs
     */
    protected complete() {
        this._jobState = JobState.Completed;
        this._completedEvent.publish();
    }
}
