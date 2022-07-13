import { sprites } from "../../asset/sprite";
import { Point, pointEquals, zeroPoint } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { Actor } from "../actor/actor";
import { FarmerActor } from "../actor/farmerActor";
import { JobQueue } from "../actor/job/jobQueue";
import { SwordsmanActor } from "../actor/swordsmanActor";
import { World } from "../world";

export class Actors {
    private _jobQueue: JobQueue;
    private actors: Actor[] = [];
    private world: World;

    public get jobQueue(): JobQueue {
        return this._jobQueue;
    }

    constructor(world: World) {
        this.world = world;
        // Set up the job queue
        this._jobQueue = new JobQueue();
        this._jobQueue.jobScheduledEvent.listen(() => {
            this.onJobScheduled();
        });
        // Set up the default actors
        this.addActor(new SwordsmanActor(zeroPoint));
        this.addActor(
            new FarmerActor({
                x: 0,
                y: 1,
            })
        );
        this.addActor(
            new FarmerActor({
                x: 1,
                y: 0,
            })
        );
    }

    /**
     * Add an actor to the list of actors currently active in the world
     * @param actor the actor to add
     */
    addActor(actor: Actor) {
        this.actors.push(actor);
        actor.world = this.world;
        //Set up a job for this actor if any and listen for completion of jobs
        actor.jobCompletedEvent.listen(() => {
            this.requestNewJob(actor);
        });
        this.requestNewJob(actor);
    }

    /**
     * Removes the actor from the list of currently active actors
     * @param actor
     */
    removeActor(actor: Actor) {
        this.actors = this.actors.filter((it) => it != actor);
        actor.dispose();
    }

    /**
     * Retrieve the actor at a given tile position
     * @param tilePosition the position to look at
     * @returns the first actor at this tile position
     */
    getActor(tilePosition: Point): Actor | null {
        return (
            this.actors.find((actor) =>
                pointEquals(actor.tilePosition, tilePosition)
            ) || null
        );
    }

    /**
     * Update all actors currently active
     * @param tick the game tick for this update
     */
    onUpdate(tick: number) {
        for (const actor of this.actors) {
            actor.onUpdate(tick);
        }
    }

    /**
     * Draw all actors currently active
     * @param context the context used to draw actors
     */
    onDraw(context: RenderContext) {
        for (const actor of this.actors) {
            actor.onDraw(context);
        }
    }

    /**
     * Check for available actors when a job has been scheduled
     */
    private onJobScheduled() {
        const idleActors = this.actors.filter((actor) => {
            return actor instanceof FarmerActor && !actor.hasJob;
        });

        // If there is an idle actor pick a pending job and assign it
        if (idleActors.length > 0) {
            const job = this.jobQueue.pendingJobs.pop();
            if (job) {
                const actor = idleActors[0];
                console.log("Actor was idle, assinging job to it", actor, job);
                actor.assignJob(job);
            }
        }
    }

    private requestNewJob(actor: Actor) {
        //TODO: Generated a sort list from jobs based on proximity
        const job = this._jobQueue.pendingJobs.pop();
        if (job) {
            actor.assignJob(job);
        }
    }
}
