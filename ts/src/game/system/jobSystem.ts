import { removeItem } from "../../common/array.js";
import { EcsSystem } from "../../common/ecs/ecsSystem.js";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../component/jobQueueComponent.js";
import { JobRunnerComponentId } from "../component/jobRunnerComponent.js";
import { SpaceComponentId } from "../component/spaceComponent.js";
import { Entity } from "../entity/entity.js";
import type { Job, JobConstraint, JobHandler } from "../job/job.js";
import { jobHandlers } from "../job/jobHandlers.js";

export const JobSystem: EcsSystem = {
    onInit: onInit,
    onUpdate: updateJobs,
};

function onInit(root: Entity) {
    root.setEcsComponent(createJobQueueComponent());
}

function meetsConstraints(runner: Entity, job: Job): boolean {
    if (!job.constraint) {
        return true;
    }

    switch (job.constraint.type) {
        case "entity":
            return runner.id === job.constraint.id;
        default:
            return true;
    }
}

function updateJobs(root: Entity, _gameTime: number) {
    const queue = root.requireEcsComponent(JobQueueComponentId);
    const runners = root.queryComponents(JobRunnerComponentId);
    for (const [entity, component] of runners) {
        let currentJob = component.currentJob;
        //If there is no job, check if we can assign one
        if (!currentJob) {
            const availableJobs = queue.jobs.filter((job) =>
                meetsConstraints(entity, job),
            );
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
        const scene = entity.requireAncestorEntity(SpaceComponentId);
        handler(scene, root, entity, currentJob);
    }
}
