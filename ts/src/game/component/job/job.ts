import { InvalidStateError } from "../../../common/error/invalidStateError.js";
import { NotInitializedError } from "../../../common/error/notInitializedError.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { Entity } from "../../entity/entity.js";
import { JobOwner } from "./jobOwner.js";
import { JobConstraint } from "./jobConstraint.js";

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
    private _entity: Entity | null = null;
    private _jobState: JobState = JobState.NotStarted;
    private _constraint: JobConstraint | null = null;
    private _startTick: number = 0;
    private _owner: JobOwner | null = null;

    /**
     * Return the owner for this job. The owner of a job is responsible for
     * executing it is functions and handling completion and aborting.
     */
    public get owner(): JobOwner | null {
        return this._owner;
    }
    /**
     * Set the owner for this job. This job will be used for handling aborting
     * and completing.
     */
    public set owner(value: JobOwner | null) {
        this._owner = value;
    }

    /**
     * The gametime tick that this job was started on
     */
    public get startTick(): number {
        return this._startTick;
    }
    /**
     * Set the game time tick this job was started on
     */
    public set startTick(value: number) {
        if (this._startTick != 0) {
            throw new InvalidStateError(
                "Cannot set start tick after it is set"
            );
        }
        this._startTick = value;
    }

    /**
     * The constraint used when assigning this job to a runner
     */
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
     * The entity this job is assigned to
     * Will throw if it is not set
     */
    public get entity(): Entity {
        if (this._entity) {
            return this._entity;
        } else {
            throw new NotInitializedError("entity");
        }
    }

    /**
     * Set the actor this job is assigned to
     */
    public set entity(entity: Entity) {
        if (!entity) {
            throw new Error("attempted to set entity to null");
        }

        this._entity = entity;
    }

    public get isSuspendable(): Boolean {
        return false;
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

    onSuspend() {}
    onResume() {}

    /**
     * Render anything this job wants to show. Note that this method will
     * be called both while pending and while active and any overriden
     * logic should consider that entity can be null and the job not started
     * @param renderContext the context to render to
     */
    onDraw(renderContext: RenderContext) {}

    /**
     * Abort this job, setting its state to completed and publishing completion
     */
    public abort() {
        console.log("Aborting job");
        this._jobState = JobState.Completed;
        if (this._owner) {
            this._owner.onAbort(this);
        } else {
            console.warn("Job was aborted without any owner", this);
        }
    }

    /**
     * Signal that this job is completed and any actors performing it can
     * take on new jobs
     */
    protected complete() {
        console.log("Job completed", this);
        this._jobState = JobState.Completed;
        if (this._owner) {
            this._owner.onComplete(this);
        } else {
            console.warn("Job was completed without any owner", this);
        }
    }
}
