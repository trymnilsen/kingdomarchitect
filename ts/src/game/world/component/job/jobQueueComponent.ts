import { InvalidStateError } from "../../../../common/error/invalidStateError";
import { Event, EventListener } from "../../../../common/event";
import { Job } from "../../actor/job/job";
import { EntityComponent } from "../entityComponent";
import { JobQueue } from "./jobQueue";
import { JobRunnerComponent } from "./jobRunnerComponent";

export class JobQueueComponent extends EntityComponent implements JobQueue {
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
            this._pendingJobs.push(job);
        }
    }

    removeJob(job: Job): void {
        throw new Error("Method not implemented.");
    }

    private assignJobToAvailableEntity(job: Job): boolean {
        // Visit all child entities using a breadth first search
        // and check if they are applicable for this job
        if (!this.entity) {
            console.error("No entity set for component, cannot assign job");
            return false;
        }

        const searchEntities = [...this.entity.children];

        while (searchEntities.length > 0) {
            // Pick the first entity in the search list
            const entity = searchEntities.shift();

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
            for (const child of this.entity.children) {
                searchEntities.push(child);
            }
        }

        return false;
    }
}
