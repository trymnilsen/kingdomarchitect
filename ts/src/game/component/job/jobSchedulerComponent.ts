import { InvalidStateError } from "../../../common/error/invalidStateError.js";
import { EventHandle } from "../../../common/event.js";
import { EntityComponent } from "../entityComponent.js";
import { Job } from "./job.js";
import { JobQueueComponent } from "./jobQueueComponent.js";
import { JobRunnerComponent } from "./jobRunnerComponent.js";

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

    private assignJobToAvailableEntity(scheduledJob: Job) {
        const runners = this.entity
            .getRootEntity()
            .queryComponents(JobRunnerComponent);

        const candidates: { runner: JobRunnerComponent; rank: number }[] = [];
        for (const runner of runners) {
            const canRunJobs =
                !!runner &&
                !runner.hasActiveJob &&
                runner.isOpenForExternalJobs;

            if (!canRunJobs) {
                continue;
            }

            try {
                const constraintRank = scheduledJob.getConstraintRank(
                    runner.entity,
                );

                if (constraintRank == 0) {
                    continue;
                }

                candidates.push({
                    runner: runner,
                    rank: constraintRank,
                });
            } catch (err) {
                console.error("Failed to run ranking on scheduled job", err);
            }
        }

        if (candidates.length > 0) {
            candidates.sort((a, b) => b.rank - a.rank);
            const selectedRunner = candidates[0].runner;
            try {
                selectedRunner.assignJob(scheduledJob);
            } finally {
                this.queue?.removeJob(scheduledJob);
            }
        }
    }
}
