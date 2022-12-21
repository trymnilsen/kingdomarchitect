import { randomEntry } from "../../common/array";
import { Point, pointEquals, zeroPoint } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { Actor } from "../actor/actor";
import { FarmerActor } from "../actor/actors/farmerActor";
import { Job } from "../actor/job/job";
import { JobQueue } from "../actor/job/jobQueue";
import { SwordsmanActor } from "../actor/actors/swordsmanActor";
import { World } from "../world";
import { JobQuery } from "../actor/job/jobQuery";

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
        this._jobQueue.jobScheduledEvent.listen((job) => {
            this.onJobScheduled(job);
        });
        // Set up the default actors
        this.addActor(new SwordsmanActor(zeroPoint()));
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
            console.log("Job completed for actor, requesting new", actor);
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
     * Returns actors based on the given predicate
     * @param predicate a callback for retrieving actor
     * @returns a list of actors
     */
    getActors(predicate: (actor: Actor) => boolean): Actor[] {
        return this.actors.filter(predicate);
    }

    /**
     * Checks if there exists any jobs that matches the provided query
     * If multiple jobs matches the first is returned
     * @param query the query for a job
     * @returns the job or null if there are no jobs that matches
     */
    queryJob(query: JobQuery): Job | null {
        //Check the job queue first
        const queuedJobs = this._jobQueue.pendingJobs;
        const matchingQueuedJob = queuedJobs.find((job) => query.matches(job));
        // if the job was truthy return it
        if (!!matchingQueuedJob) {
            return matchingQueuedJob;
        }
        // Check actors for any jobs
        const actorMatchedJob = this.actors.find((actor) => {
            if (!!actor.job) {
                return query.matches(actor.job);
            } else {
                return false;
            }
        });

        if (!!actorMatchedJob?.job) {
            return actorMatchedJob.job;
        }

        // No job was found
        return null;
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
        for (const job of this._jobQueue.pendingJobs) {
            job.onDraw(context);
        }
        for (const actor of this.actors) {
            actor.onDraw(context);
        }
    }

    /**
     * Check for available actors when a job has been scheduled
     */
    private onJobScheduled(job: Job) {
        const idleActors = this.actors.filter((actor) => {
            // If the actor already has a job, return early
            if (actor.hasJob) {
                return false;
            }

            // Check if the job is applicable for the actor. If no constraint
            // is set on the job it is considered applicable
            const isJobApplicableForActor =
                job.constraint?.isActorApplicableForJob(job, actor);

            return isJobApplicableForActor;
        });

        // If there is an idle actor pick a pending job and assign it
        if (idleActors.length > 0) {
            const job = this.jobQueue.pop();
            if (job) {
                const actor = randomEntry(idleActors);
                console.log("Actor was idle, assinging job to it", actor, job);
                actor.assignJob(job);
            }
        } else {
            console.log(`No actors idle for job ${job.constructor.name} yet`);
        }
    }

    /**
     * Invoked when a actor has finished their job and needs a new one.
     * @param actor the actor that finished a job
     */
    private requestNewJob(actor: Actor) {
        // Filter out jobs that are not applicable for this actor
        const availableJobs = this._jobQueue.pendingJobs.filter((job) => {
            return job.constraint?.isActorApplicableForJob(job, actor);
        });
        // pick the first applicable job
        let job: Job | null | undefined = availableJobs[0];
        let isIdleJob = false;
        // if no job is available for the actor, ask for any idle jobs
        if (!job) {
            job = actor.onIdle();
            if (job) {
                isIdleJob = true;
            }
        }

        if (job) {
            // remove it from the list of pending jobs
            if (!isIdleJob) {
                this._jobQueue.removeJob(job);
            }
            actor.assignJob(job);
        }
    }
}
