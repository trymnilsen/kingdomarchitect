import { InvalidStateError } from "../../../common/error/invalidStateError.js";
import { NotInitializedError } from "../../../common/error/notInitializedError.js";
import { JSONValue } from "../../../common/object.js";
import { Point, isPointAdjacentTo } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { Entity } from "../../entity/entity.js";
import { JobConstraint } from "./jobConstraint.js";
import { JobOwner } from "./jobOwner.js";
import { JobState } from "./jobState.js";

export enum JobCompletedResult {
    Aborted,
    Success,
}

/**
 * Job is the base class for logic that can be queued and assigned to actors.
 * A job will update either until it is interupted or completed. Actions like
 * chopping a tree or collecting a chest is implemented as jobs. Actions that
 * interupts such as attacks are also implemented as jobs.
 */
export abstract class Job {
    private _entity: Entity | null = null;
    private _jobState: JobState = JobState.NotStarted;
    private _startTick = 0;
    private _owner: JobOwner | null = null;
    private _constraints: JobConstraint[] = [];

    /**
     * Return the owner for this job. The owner of a job is responsible for
     * executing it is functions and handling completion and aborting.
     */
    get owner(): JobOwner | null {
        return this._owner;
    }
    /**
     * Set the owner for this job. This job will be used for handling aborting
     * and completing.
     */
    set owner(value: JobOwner | null) {
        this._owner = value;
    }

    /**
     * The gametime tick that this job was started on
     */
    get startTick(): number {
        return this._startTick;
    }
    /**
     * Set the game time tick this job was started on
     */
    set startTick(value: number) {
        if (this._startTick != 0) {
            throw new InvalidStateError(
                "Cannot set start tick after it is set",
            );
        }
        this._startTick = value;
    }

    /**
     * Get the current state of the job
     */
    get jobState(): JobState {
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
    set jobState(v: JobState) {
        if (v == JobState.NotStarted) {
            throw new InvalidStateError(
                "Cannot set job state to not started, this the default state",
            );
        }

        if (this._jobState == JobState.Completed) {
            throw new InvalidStateError(
                `Job already completed, unable to change state to: ${v}`,
            );
        }

        if (this._jobState == JobState.Running && v != JobState.Completed) {
            throw new InvalidStateError(
                `Can only transition to end-state from running, attempted to set: ${v}`,
            );
        }

        this._jobState = v;
    }

    /**
     * The entity this job is assigned to
     * Will throw if it is not set
     */
    get entity(): Entity {
        if (this._entity) {
            return this._entity;
        } else {
            throw new NotInitializedError("entity");
        }
    }

    /**
     * Set the actor this job is assigned to
     */
    set entity(entity: Entity) {
        if (!entity) {
            throw new Error("attempted to set entity to null");
        }

        this._entity = entity;
    }

    get isSuspendable(): boolean {
        return false;
    }

    constructor(constraints: JobConstraint[] = []) {
        this._constraints = constraints;
    }

    getConstraintRank(entity: Entity): number {
        if (this._constraints.length == 0) {
            //No constraints means anybody can take this job
            return 1;
        }

        let totalRank = 0;
        for (const constraint of this._constraints) {
            const rank = constraint.rankEntity(entity);
            if (rank == 0) {
                //A rank of 0 from a constraint will short-circuit the others
                return 0;
            } else {
                totalRank += rank;
            }
        }
        const averageRank = totalRank / this._constraints.length;
        return averageRank;
    }

    returnToQueue() {
        if (this._owner) {
            console.log("Returning job to queue", this);
            this._owner.onReturnToQueue();
        } else {
            console.warn("Job was aborted without any owner", this);
        }
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
        //console.debug("Job completed", this);
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
    onDraw(_renderContext: RenderContext) {}

    /**
     * Request to update this job. Called when attached to an actor and running
     * as their active job. Any inherited methods should call `super.update`.
     * TODO: Actor and World should be arguments?
     * @param tick the game tick
     */
    abstract update(tick: number): void;

    /**
     * Check if a point is adjacent to the entity of this job
     * @param point the adjacent point
     * @returns if the point is adjacent to this job
     */
    protected adjacentTo(point: Point): boolean {
        return isPointAdjacentTo(this.entity.worldPosition, point);
    }
}
