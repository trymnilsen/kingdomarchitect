import type { JobId } from "./job.ts";

/**
 * Jobs whose plans write into the worker's HeldItemComponent. The job
 * dispatcher uses this set to prepend a deposit-or-drop step when the worker
 * is already holding something — preventing the worker from looping on a job
 * it can't complete because the held slot is occupied.
 */
export const jobsRequiringEmptyHeld: ReadonlySet<JobId> = new Set<JobId>([
    "collectResource",
    "farmHarvestJob",
    "windmillJob",
    "collectItem",
    "craftingJob",
]);
