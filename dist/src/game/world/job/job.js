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
import { NotInitializedError } from "../../../common/error/notInitializedError.js";
export var JobState;
(function(JobState) {
    JobState[JobState["NotStarted"] = 0] = "NotStarted";
    JobState[JobState["Running"] = 1] = "Running";
    JobState[JobState["Completed"] = 2] = "Completed";
})(JobState || (JobState = {}));
export var JobCompletedResult;
(function(JobCompletedResult) {
    JobCompletedResult[JobCompletedResult["Aborted"] = 0] = "Aborted";
    JobCompletedResult[JobCompletedResult["Success"] = 1] = "Success";
})(JobCompletedResult || (JobCompletedResult = {}));
export class Job {
    /**
     * Return the owner for this job. The owner of a job is responsible for
     * executing it is functions and handling completion and aborting.
     */ get owner() {
        return this._owner;
    }
    /**
     * Set the owner for this job. This job will be used for handling aborting
     * and completing.
     */ set owner(value) {
        this._owner = value;
    }
    /**
     * The gametime tick that this job was started on
     */ get startTick() {
        return this._startTick;
    }
    /**
     * Set the game time tick this job was started on
     */ set startTick(value) {
        if (this._startTick != 0) {
            throw new InvalidStateError("Cannot set start tick after it is set");
        }
        this._startTick = value;
    }
    /**
     * The constraint used when assigning this job to a runner
     */ get constraint() {
        return this._constraint;
    }
    /**
     * Get the current state of the job
     */ get jobState() {
        return this._jobState;
    }
    /**
     * Set the state of the job, this will also check that the transition of
     * the state is valid.
     *
     * If the job is not started, it cannot be updated to not started
     * If the job is complete, the state cannot be updated
     * If the job is running the only valid transition is completed
     */ set jobState(v) {
        if (v == JobState.NotStarted) {
            throw new InvalidStateError("Cannot set job state to not started, this the default state");
        }
        if (this._jobState == JobState.Completed) {
            throw new InvalidStateError(`Job already completed, unable to change state to: ${v}`);
        }
        if (this._jobState == JobState.Running && v != JobState.Completed) {
            throw new InvalidStateError(`Can only transition to end-state from running, attempted to set: ${v}`);
        }
        this._jobState = v;
    }
    /**
     * The entity this job is assigned to
     * Will throw if it is not set
     */ get entity() {
        if (this._entity) {
            return this._entity;
        } else {
            throw new NotInitializedError("entity");
        }
    }
    /**
     * Set the actor this job is assigned to
     */ set entity(entity) {
        if (!entity) {
            throw new Error("attempted to set entity to null");
        }
        this._entity = entity;
    }
    /**
     * invoked when the job is started
     */ onStart() {}
    /**
     * Render anything this job wants to show. Note that this method will
     * be called both while pending and while active and any overriden
     * logic should consider that entity can be null and the job not started
     * @param renderContext the context to render to
     */ onDraw(renderContext) {}
    /**
     * Abort this job, setting its state to completed and publishing completion
     */ abort() {
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
     */ complete() {
        console.log("Job completed", this);
        this._jobState = JobState.Completed;
        if (this._owner) {
            this._owner.onComplete(this);
        } else {
            console.warn("Job was completed without any owner", this);
        }
    }
    constructor(constraint){
        _define_property(this, "_entity", null);
        _define_property(this, "_jobState", JobState.NotStarted);
        _define_property(this, "_constraint", null);
        _define_property(this, "_startTick", 0);
        _define_property(this, "_owner", null);
        if (constraint) {
            this._constraint = constraint;
        }
    }
}
