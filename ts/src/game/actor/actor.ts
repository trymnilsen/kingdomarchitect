import { Sprite } from "../../asset/sprite";
import { Event, EventListener } from "../../common/event";
import { NotInitializedError } from "../../common/error/notInitializedError";
import { addPoint, Point } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { World } from "../world";
import { Job, JobState } from "./job/job";
import { InvalidStateError } from "../../common/error/invalidStateError";
import { Behavior } from "./behavior/behavior";

/**
 * Actors is the base for all interactive objects in the game world.
 */
export abstract class Actor {
    private _tilePosition: Point;
    private _jobCompleted: Event<void>;
    private _world: World | null = null;
    private _job: Job | null = null;
    private _behavior: Behavior | null = null;
    private _tags: string[] = [];
    private sprite: Sprite;

    public get hasJob(): boolean {
        return !!this._job;
    }

    /**
     * Event updated whenever the assigned job of this actor finishes
     */
    public get jobCompletedEvent(): EventListener<void> {
        return this._jobCompleted;
    }

    public get behavior(): Behavior | null {
        return this._behavior;
    }

    public set behavior(value: Behavior | null) {
        this._behavior = value;
    }

    /**
     * The position of the actor in tile space
     */
    public get tilePosition(): Point {
        return this._tilePosition;
    }

    public get world(): World {
        if (this._world) {
            return this._world;
        } else {
            throw new NotInitializedError("world");
        }
    }

    public set world(v: World) {
        this._world = v;
    }

    public get tags(): string[] {
        return this._tags;
    }

    constructor(initialPosition: Point, sprite: Sprite) {
        this._tilePosition = initialPosition;
        this._jobCompleted = new Event();
        this.sprite = sprite;
    }

    /**
     * Invoked when the actor does not have any available jobs.
     * @returns an idle job or null if no idle job should be scheduled
     */
    onIdle(): Job | null {
        return null;
    }

    /**
     * Update the actor and any attached jobs.
     * @param tick the current world tick number
     */
    onUpdate(tick: number) {
        this;
        const job = this._job;
        if (job) {
            if (job.startTick == 0) {
                job.startTick = tick;
            }
            job.update(tick);
        }
    }

    /**
     * Assign a new job to this actor. This will stop any active jobs.
     * @param job the job to assign to this actor
     */
    assignJob(job: Job) {
        if (this._job == job) {
            throw new InvalidStateError(
                `Job ${job} already assigned to actor ${this}`
            );
        }
        job.actor = this;
        job.onStart();
        job.jobState = JobState.Running;
        this._job = job;
        this._job.completedEvent.listenOnce(() => {
            this.onJobCompleted();
        });
    }

    /**
     * Draw the actor and then any active jobs
     * @param context the rendering context to use for the actor
     */
    onDraw(context: RenderContext) {
        const worldspace = context.camera.tileSpaceToWorldSpace(
            this.tilePosition
        );
        const offsetPosition = addPoint(worldspace, { x: 3, y: 3 });
        // Draw the sprite of this actor
        context.drawSprite({
            sprite: this.sprite,
            x: offsetPosition.x,
            y: offsetPosition.y,
        });

        // Draw any job effects that the actor is currently doing
        const currentJob = this._job;
        if (currentJob) {
            currentJob.onDraw(context);
        }
    }

    /**
     * Dispose this actor and any dependencies if required
     */
    dispose() {
        this._jobCompleted.dispose();
    }

    private onJobCompleted() {
        this._job = null;
        this._jobCompleted.publish();
    }
}
