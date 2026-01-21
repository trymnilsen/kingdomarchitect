import { attackHandler } from "./attackJob.ts";
import { buildBuildingHandler } from "./buildBuildingJob.ts";
import { collectItemHandler } from "./collectItemJob.ts";
import { collectResourceHandler } from "./collectResourceJob.ts";
import { craftingJobHandler } from "./craftingJobHandler.ts";
import type { JobId, Jobs, JobHandler } from "./job.ts";
import { moveToJobHandler } from "./moveToPointJob.ts";
import type { Entity } from "../entity/entity.ts";

/**
 * Type-safe map of job IDs to their handlers
 */
export type JobHandlerMap = {
    [K in JobId]: JobHandler<Extract<Jobs, { id: K }>>;
};

/**
 * Central registry of all job handlers.
 * This map is used by the job system to dispatch jobs to their handlers,
 * and can be used in tests to get the appropriate handler for a job.
 */
export const jobHandlers: JobHandlerMap = {
    moveToJob: moveToJobHandler,
    buildBuildingJob: buildBuildingHandler,
    attackJob: attackHandler,
    collectItem: collectItemHandler,
    collectResource: collectResourceHandler,
    craftingJob: craftingJobHandler,
} as const;

/**
 * Get the handler for a specific job
 * @param jobId The ID of the job
 * @returns The handler function for the job
 */
export function getJobHandler<T extends Jobs>(
    jobId: T["id"],
): JobHandler<T> | undefined {
    return jobHandlers[jobId] as JobHandler<T> | undefined;
}
