import { InvalidStateError } from "../../../common/error/invalidStateError.js";
import { EventHandle } from "../../../common/event.js";
import { StatelessComponent } from "../entityComponent.js";
import { Job } from "./job.js";
import { JobQueueComponent } from "./jobQueueComponent.js";
import { JobRunnerComponent } from "./jobRunnerComponent.js";

/**
 * The JobSchedulerComponent listens for events on jobs added to the job queue.
 * Once a job is added it looks for available runners and assigns the job to
 * that runner. This code is split out from the queue to avoid circular
 * dependencies between the JobRunner and JobQueue.
 */
export class JobSchedulerComponent extends StatelessComponent {
    private jobQueueAddedListener: EventHandle | undefined;
    private queue: JobQueueComponent | undefined;
    override onStart(tick: number): void {
        if (!this.entity) {
            throw new Error("JobScheduler not attached to entity");
        }

        const queue = this.entity.getComponent(JobQueueComponent);
        if (!queue) {
            throw new Error(
                "No job queue component on same entity as scheduler"
            );
        }
        this.jobQueueAddedListener = queue.jobScheduledEvent.listen((job) => {
            this.assignJobToAvailableEntity(job);
        });
    }

    override onStop(tick: number): void {
        if (this.jobQueueAddedListener) {
            this.jobQueueAddedListener();
        }
    }

    private assignJobToAvailableEntity(job: Job) {
        // Visit all child entities using a breadth first search
        // and check if they are applicable for this job
        if (!this.entity) {
            console.error("No entity set for component, cannot assign job");
            return;
        }

        const searchEntities = [...this.entity.children];
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
            const canRunJobs =
                !!jobRunner &&
                !jobRunner.hasActiveJob &&
                jobRunner.isOpenForExternalJobs;

            if (canRunJobs) {
                const constraint = job.constraint?.isEntityApplicableForJob(
                    job,
                    entity
                );

                // if the constraint is false we cannot assign the job
                // all other cases (undefined, null and true) will treat
                // the entity as applicable for running the job
                const isApplicable = !(constraint === false);
                if (isApplicable) {
                    this.queue?.removeJob(job);
                    jobRunner.assignJob(job);
                    return;
                }
            }

            // Add the children of this entity to nodes to search
            for (const child of entity.children) {
                searchEntities.push(child);
            }
        }
    }
}