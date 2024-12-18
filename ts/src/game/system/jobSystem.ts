import { pointEquals } from "../../common/point.js";
import { entityOf } from "../../ecs/ecsComponent.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { EcsUpdateEvent } from "../../ecs/event/ecsUpdateEvent.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { Job } from "../ecsComponent/job/job.js";
import { JobComponent } from "../ecsComponent/job/jobComponent.js";
import {
    MovementJob,
    movementJobId,
} from "../ecsComponent/job/jobs/movementJob.js";

export function createJobSystem(): EcsSystem {
    return createSystem({
        jobRunner: JobComponent,
        transform: TransformComponent,
    })
        .onEvent(EcsUpdateEvent, (query, _event, world) => {
            for (const entity of query) {
                runJob(entity.jobRunner, entity.transform, world);
            }
        })
        .build();
}

export function runJob(
    jobComponent: JobComponent,
    transform: TransformComponent,
    world: EcsWorldScope,
) {
    if (jobComponent.jobs.length == 0) {
        // Assign a new job for the global queue
    } else {
        const job = jobComponent.jobs[jobComponent.jobs.length - 1];
        const runner = jobFunctions[job.id];
        const runResult = runner(job, jobComponent, transform, world);
        switch (runResult) {
            case JobResult.Finished:
                jobComponent.jobs.pop();
                break;
            case JobResult.Cancelled:
                jobComponent.jobs.pop();
                //TODO: return the job to the queue on cancel
                break;
            case JobResult.Continue:
                break;
        }
    }
}

enum JobResult {
    Continue,
    Finished,
    Cancelled,
}

type JobFunction = (
    job: Job,
    jobComponent: JobComponent,
    transform: TransformComponent,
    world: EcsWorldScope,
) => JobResult;

const jobFunctions: { [id: string]: JobFunction } = {
    [movementJobId]: movementFunction as JobFunction,
};

function movementFunction(
    job: MovementJob,
    _component: JobComponent,
    transform: TransformComponent,
    world: EcsWorldScope,
): JobResult {
    if (pointEquals(job.target, transform.position)) {
        return JobResult.Finished;
    }

    const nextPoint = job.path.shift();
    if (!nextPoint) {
        return JobResult.Finished;
    }

    world.updateTransform(entityOf(transform), nextPoint.x, nextPoint.y);

    return JobResult.Continue;
}
