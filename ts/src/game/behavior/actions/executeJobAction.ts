import { JobRunnerComponentId } from "../../component/jobRunnerComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { getJobHandler } from "../../job/jobHandlers.ts";
import type { ActionStatus } from "./Action.ts";

/**
 * Execute the current job using the job handler system.
 */
export function executeExecuteJobAction(
    entity: Entity,
    tick: number,
): ActionStatus {
    const root = entity.getRootEntity();
    const runner = entity.getEcsComponent(JobRunnerComponentId);

    if (!runner || !runner.currentJob) {
        console.warn(
            `[ExecuteJobAction] Entity ${entity.id} has no current job`,
        );
        return "failed";
    }

    const job = runner.currentJob;
    const handler = getJobHandler(job.id);

    if (!handler) {
        console.warn(
            `[ExecuteJobAction] No handler found for job type ${job.id}`,
        );
        return "failed";
    }

    try {
        handler(root, entity, job, tick);
    } catch (error) {
        console.error(
            `[ExecuteJobAction] Error executing job ${job.id}:`,
            error,
        );
        return "failed";
    }

    // Check if job is complete (handler sets currentJob to null when done)
    if (!runner.currentJob) {
        return "complete";
    }

    return "running";
}
