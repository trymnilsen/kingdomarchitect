import { Event, EventListener } from "../../../common/event";
import { NotInitializedError } from "../../../common/error/notInitializedError";
import { Actor } from "../actor";
import { InvalidStateError } from "../../../common/error/invalidStateError";
import { RenderContext } from "../../../rendering/renderContext";
import { JobConstraint } from "./jobConstraint";

export enum JobState {
    NotStarted,
    Running,
    Completed,
}

export enum JobCompletedResult {
    Aborted,
    Success,
}

export abstract class Job {
    private _completedEvent = new Event<JobCompletedResult>();
    private _actor: Actor | null = null;
    private _jobState: JobState = JobState.NotStarted;
    private _constraint: JobConstraint | null = null;
    private _startTick: number = 0;

    public get startTick(): number {
        return this._startTick;
    }
    public set startTick(value: number) {
        if (this._startTick != 0) {
            throw new InvalidStateError(
                "Cannot set start tick after it is set"
            );
        }
        this._startTick = value;
    }

    public get constraint(): JobConstraint | null {
        return this._constraint;
    }

    /**
     * Get the current state of the job
     */
    public get jobState(): JobState {
        return this._jobState;
    }

    /**
     * Set the state of the job, this will also check that the transition of
     * the state is valid.
     *
     * If the job is not started, it cannot be updated to not started
     * If the job is complete, the state cannot be updated
     * If the job is running the only valid transition is completed
     */
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
                `Can only transition to end-state from running, attempted to set: ${v}`
            );
        }

        this._jobState = v;
    }

    /**
     * Event that is triggered when this job is completed
     */
    public get completedEvent(): EventListener<JobCompletedResult> {
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
        if (!actor) {
            throw new Error("attempted to set actor to null");
        }

        this._actor = actor;
    }

    constructor(constraint?: JobConstraint) {
        if (constraint) {
            this._constraint = constraint;
        }
    }

    /**
     * Request to update this job. Called when attached to an actor and running
     * as their active job. Any inherited methods should call `super.update`.
     * TODO: Actor and World should be arguments?
     * @param tick the game tick
     */
    abstract update(tick: number): void;

    /**
     * invoked when the job is started
     */
    onStart() {}

    /**
     * Render anything this job wants to
     * @param renderContext the context to render to
     */
    onDraw(renderContext: RenderContext) {}

    public abort() {
        this._jobState = JobState.Completed;
        this._completedEvent.publish(JobCompletedResult.Aborted);
    }

    /**
     * Signal that this job is completed and any actors performing it can
     * take on new jobs
     */
    protected complete() {
        this._jobState = JobState.Completed;
        this._completedEvent.publish(JobCompletedResult.Success);
    }
}
