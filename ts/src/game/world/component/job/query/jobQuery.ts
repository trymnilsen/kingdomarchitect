import { Entity } from "../../../entity/entity.js";
import { Job } from "../../../job/job.js";
import { JobRunnerComponent } from "../jobRunnerComponent.js";

export interface JobQuery {
    matches(job: Job): boolean;
}

export function query(
    entity: Entity,
    query: JobQuery,
    includeRunning: boolean = true
): Job | null {
    /*
    for (const job of this._pendingJobs) {
        if (query.matches(job)) {
            return job;
        }
    }
    */

    if (includeRunning) {
        const entityQueryResult = queryEntityForRunningJob(entity, query);

        if (entityQueryResult) {
            return entityQueryResult;
        }
    }

    return null;
}

function queryEntityForRunningJob(entity: Entity, query: JobQuery): Job | null {
    const runnerComponent = entity.getComponent(JobRunnerComponent);
    if (runnerComponent && runnerComponent.activeJob) {
        const queryResult = query.matches(runnerComponent.activeJob);
        if (queryResult) {
            return runnerComponent.activeJob;
        }
    }

    for (const child of entity.children) {
        const childResult = queryEntityForRunningJob(child, query);
        if (childResult) {
            return childResult;
        }
    }

    return null;
}
