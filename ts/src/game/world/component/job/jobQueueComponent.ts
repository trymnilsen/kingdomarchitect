import { removeItem } from "../../../../common/array";
import { InvalidStateError } from "../../../../common/error/invalidStateError";
import { Event, EventListener } from "../../../../common/event";
import { Point } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { Job } from "../../job/job";
import { Entity } from "../../entity/entity";
import { EntityComponent } from "../entityComponent";
import { JobQuery } from "./query/jobQuery";
import { JobQueue } from "./jobQueue";
import { JobRunnerComponent } from "./jobRunnerComponent";
import { JobOwner } from "./jobOwner";

export class JobQueueComponent
    extends EntityComponent
    implements JobQueue, JobOwner
{
    private _pendingJobs: Job[] = [];
    _jobScheduledEvent: Event<Job> = new Event<Job>();

    get pendingJobs(): Job[] {
        return this._pendingJobs;
    }

    get jobScheduledEvent(): EventListener<Job> {
        return this._jobScheduledEvent;
    }

    schedule(job: Job): void {
        //Check if this job can be immediately assigned to an available entity
        const assigned = this.assignJobToAvailableEntity(job);
        if (!assigned) {
            job.owner = this;
            this._pendingJobs.push(job);
        }
    }

    removeJob(job: Job): void {
        const removeResult = removeItem(this._pendingJobs, job);
        if (!removeResult) {
            console.warn("Job not removed, was not in list", job);
        }
    }

    query(query: JobQuery, includeRunning: boolean = true): Job | null {
        for (const job of this._pendingJobs) {
            if (query.matches(job)) {
                return job;
            }
        }

        if (includeRunning) {
            const entityQueryResult = this.queryEntityForRunningJob(
                this.entity,
                query
            );

            if (entityQueryResult) {
                return entityQueryResult;
            }
        }

        return null;
    }

    onAbort(job: Job): void {
        this.removeJob(job);
    }

    onComplete(job: Job): void {
        this.removeJob(job);
    }

    private queryEntityForRunningJob(
        entity: Entity,
        query: JobQuery
    ): Job | null {
        const runnerComponent = entity.getComponent(JobRunnerComponent);
        if (runnerComponent && runnerComponent.activeJob) {
            const queryResult = query.matches(runnerComponent.activeJob);
            if (queryResult) {
                return runnerComponent.activeJob;
            }
        }

        for (const child of entity.children) {
            const childResult = this.queryEntityForRunningJob(child, query);
            if (childResult) {
                return childResult;
            }
        }

        return null;
    }

    private assignJobToAvailableEntity(job: Job): boolean {
        // Visit all child entities using a breadth first search
        // and check if they are applicable for this job
        if (!this.entity) {
            console.error("No entity set for component, cannot assign job");
            return false;
        }

        const searchEntities = [...this.entity.children];

        console.log("assignJobToAvailableEntity", job);
        while (searchEntities.length > 0) {
            // Pick the first entity in the search list
            const entity = searchEntities.shift();
            console.log("assignJobToAvailableEntity - search entity", entity);
            if (!entity) {
                throw new InvalidStateError(
                    "Shifted item in list with >0 length was undefined"
                );
            }

            // Check if this node is applicable
            const jobRunner = entity.getComponent(JobRunnerComponent);
            // If the child has a runner component and that runner does not
            // have an active job check if it is applicable
            if (!!jobRunner && !jobRunner.hasActiveJob) {
                const constraint = job.constraint?.isEntityApplicableForJob(
                    job,
                    entity
                );

                // if the constraint is false we cannot assign the job
                // all other cases (undefined, null and true) will treat
                // the entity as applicable for running the job
                const isApplicable = !(constraint === false);
                if (isApplicable) {
                    jobRunner.assignJob(job);
                    return true;
                }
            }

            // Add the children of this entity to nodes to search
            for (const child of entity.children) {
                searchEntities.push(child);
            }
        }

        return false;
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        for (const pendingJob of this._pendingJobs) {
            pendingJob.onDraw(context);
        }
    }
}
