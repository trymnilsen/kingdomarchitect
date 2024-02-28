import { InvalidStateError } from "../../../common/error/invalidStateError.js";
import { EventHandle } from "../../../common/event.js";
import { EntityComponent } from "../entityComponent.js";
import { isJobApplicableForEntity } from "./jobConstraint.js";
import { JobQueueComponent } from "./jobQueueComponent.js";
import { JobRunnerComponent } from "./jobRunnerComponent.js";
import { ScheduledJob } from "./scheduledJob.js";

/**
 * The JobSchedulerComponent listens for events on jobs added to the job queue.
 * Once a job is added it looks for available runners and assigns the job to
 * that runner. This code is split out from the queue to avoid circular
 * dependencies between the JobRunner and JobQueue.
 */
export class JobSchedulerComponent extends EntityComponent {
    private jobQueueAddedListener: EventHandle | undefined;
    private queue: JobQueueComponent | undefined;
    override onStart(): void {
        if (!this.entity) {
            throw new Error("JobScheduler not attached to entity");
        }

        const queue = this.entity.getComponent(JobQueueComponent);
        if (!queue) {
            throw new Error(
                "No job queue component on same entity as scheduler",
            );
        }
        this.queue = queue;
        this.jobQueueAddedListener = queue.jobScheduledEvent.listen((job) => {
            this.assignJobToAvailableEntity(job);
        });
    }

    override onStop(): void {
        if (this.jobQueueAddedListener) {
            this.jobQueueAddedListener();
        }
    }

    private assignJobToAvailableEntity(scheduledJob: ScheduledJob) {
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
            if (!entity) {
                throw new InvalidStateError(
                    "Shifted item in list with >0 length was undefined",
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
                let isApplicable = true;
                if (scheduledJob.constraint) {
                    isApplicable = isJobApplicableForEntity(
                        scheduledJob.job,
                        scheduledJob.constraint,
                        entity,
                    );
                }

                if (isApplicable) {
                    this.queue?.removeJob(scheduledJob.job);
                    console.log("Assign job", scheduledJob.job, entity);
                    jobRunner.assignJob(scheduledJob.job);
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
