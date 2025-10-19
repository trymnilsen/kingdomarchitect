import { removeItem } from "../../common/array.js";
import { EcsSystem } from "../../common/ecs/ecsSystem.js";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../component/jobQueueComponent.js";
import { JobRunnerComponentId } from "../component/jobRunnerComponent.js";
import { Entity } from "../entity/entity.js";
import type { Job, JobHandler } from "../job/job.js";
import { jobHandlers } from "../job/jobHandlers.js";

export const JobSystem: EcsSystem = {
    onInit: onInit,
    onUpdate: updateJobs,
};

function onInit(root: Entity) {
    root.setEcsComponent(createJobQueueComponent());
}

function updateJobs(root: Entity, scope: Entity, _gameTime: number) {
    const queue = root.requireEcsComponent(JobQueueComponentId);
    const runners = root.queryComponents(JobRunnerComponentId);
    for (const [entity, component] of runners) {
        let currentJob = component.currentJob;
        //If there is no job, check if we can assign one
        if (!currentJob) {
            const availableJobs = queue.jobs.filter((job) => job);
            const selectedJob = availableJobs.shift();
            if (!!selectedJob) {
                console.log(
                    "Assigning job to runner",
                    selectedJob.id,
                    entity.id,
                );
                //The shift only removes from the filtered list, we also need
                //to remove if from the queue
                removeItem(queue.jobs, selectedJob);
                component.currentJob = selectedJob;
                currentJob = selectedJob;
                root.invalidateComponent(JobQueueComponentId);
                entity.invalidateComponent(JobRunnerComponentId);
            }
        }

        if (!currentJob) {
            continue;
        }

        const handler = jobHandlers[currentJob.id] as JobHandler<Job>;
        if (!handler) {
            continue;
        }
        console.log("Updating job", currentJob.id);
        handler(scope, entity, currentJob);
    }
}
