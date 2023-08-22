import { InvalidStateError } from "../../../common/error/invalidStateError.js";
import { NotInitializedError } from "../../../common/error/notInitializedError.js";
import { JSONValue } from "../../../common/object.js";
import { Point, isPointAdjacentTo } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { Entity } from "../../entity/entity.js";
import { MovementBundle, MovementHelper } from "./helper/movementHelper.js";
import { JobConstraint } from "./jobConstraint.js";
import { JobOwner } from "./jobOwner.js";

export enum JobState {
    NotStarted,
    Running,
    Completed,
}

export enum JobCompletedResult {
    Aborted,
    Success,
}

export type JobBundle<T extends JSONValue = {}> = {
    data: T;
    type: string;
    jobState: JobState;
    movement?: MovementBundle;
};

/**
 * Job is the base class for logic that can be queued and assigned to actors.
 * A job will update either until it is interupted or completed. Actions like
 * chopping a tree or collecting a chest is implemented as jobs. Actions that
 * interupts such as attacks are also implemented as jobs.
 */
export abstract class Job<T extends JSONValue = {}> {
    private _entity: Entity | null = null;
    private _jobState: JobState = JobState.NotStarted;
    private _constraint: JobConstraint | null = null;
    private _startTick: number = 0;
    private _owner: JobOwner | null = null;
    private _movementHelper: MovementHelper | null = null;
    private _bundle: T | null = null;
    /**
     * Return the bundle this job was saved with
     */
    public get bundle(): Readonly<T> | null {
        return this._bundle;
    }

    /**
     * Set the persisted bundle used for this job
     */
    public set bundle(value: T) {
        this._bundle = value;
    }
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

    public get movement(): MovementHelper {
        if (!this._entity) {
            throw new Error(
                "Cannot access movement helper before entity is set"
            );
        }
        //Lazily create the helper if needed
        if (!this._movementHelper) {
            this._movementHelper = new MovementHelper();
            this._movementHelper.entity = this.entity;
        }

        return this._movementHelper;
    }

    constructor(constraint?: JobConstraint) {
        if (constraint) {
            this._constraint = constraint;
        }
    }

    /**
     * Restore the job from a persisted job bundle
     * @param bundle the persisted data to restore
     */
    fromJobBundle(bundle: JobBundle<T>): void {
        this._jobState = bundle.jobState;
        this._bundle = bundle.data;
        if (!!bundle.movement) {
            this.movement.fromBundle(bundle.movement);
        }
        this.onFromPersistedState(bundle.data);
    }

    /**
     * Save the state of this job to a job bundle. Will include generic and
     * helper state as well as custom data persisted by any implementations of
     * this job
     */
    toJobBundle(): JobBundle<T> {
        const jobState = this.onPersistJobState();
        const bundle: JobBundle<T> = {
            jobState: this._jobState,
            movement: this._movementHelper?.toBundle(),
            data: jobState,
            type: this.constructor.name,
        };

        return bundle;
    }

    /**
     * Abort this job, setting its state to completed and publishing completion
     */
    abort() {
        console.log("Aborting job");
        this._jobState = JobState.Completed;
        if (this._owner) {
            this._owner.onAbort(this as Job);
        } else {
            console.warn("Job was aborted without any owner", this);
        }
    }

    /**
     * Signal that this job is completed and any actors performing it can
     * take on new jobs
     */
    complete() {
        console.log("Job completed", this);
        this._jobState = JobState.Completed;
        if (this._owner) {
            this._owner.onComplete(this as Job);
        } else {
            console.warn("Job was completed without any owner", this);
        }
    }

    /**
     * invoked when the job is started, dependencies like entity is guaranteed
     * to be set at this point. Avoid resolving entities or data in this
     * method and prefer to do it in `onFromPersistedState` as onStart will not
     * be called when a job that has been started is created from the save state
     * and the job could end up without the needed object references.
     */
    onStart() {}

    /**
     * Called if this job is interuped and the job is stopped to run another
     * job. Will only be called if the job is suspendedable
     */
    onSuspend() {}

    /**
     * Called when a job is resumed after having been interupted. Will only be
     * called if the job is suspendable.
     */
    onResume() {}

    /**
     * Render anything this job wants to show. Note that this method will
     * be called both while pending and while active and any overriden
     * logic should consider that entity can be null and the job not started
     * @param renderContext the context to render to
     */
    onDraw(renderContext: RenderContext) {}

    /**
     * Request to update this job. Called when attached to an actor and running
     * as their active job. Any inherited methods should call `super.update`.
     * TODO: Actor and World should be arguments?
     * @param tick the game tick
     */
    abstract update(tick: number): void;

    /**
     * Request that the job create an object that is used to presist its state
     */
    protected onPersistJobState(): T {
        return {} as T;
    }

    /**
     * Invoked on restore to reset the state of this job after recreating the
     * game from saved state. Will be called after the entity is set if any
     * so logic requiring the entity tree can be used here.
     * @param bundle provides the locally saved bundle as a non-nullable value
     */
    protected onFromPersistedState(bundle: T) {}

    /**
     * Check if a point is adjacent to the entity of this job
     * @param point the adjacent point
     * @returns if the point is adjacent to this job
     */
    protected adjacentTo(point: Point): boolean {
        return isPointAdjacentTo(this.entity.worldPosition, point);
    }
}
