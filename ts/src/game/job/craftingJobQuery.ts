import {
    BehaviorAgentComponentId,
    type BehaviorAgentComponent,
} from "../component/BehaviorAgentComponent.ts";
import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { CraftingJobId, type CraftingJob } from "./craftingJob.ts";

export type CraftingJobDisplayInfo = {
    job: CraftingJob;
    /** Progress as a fraction from 0 to 1. 0 = not started, 1 = complete. */
    progressFraction: number;
};

/**
 * Find all crafting jobs targeting a specific building, across all job queues.
 * Claimed jobs are listed first (active work), then unclaimed in queue order.
 */
export function getCraftingJobsForBuilding(
    buildingEntity: Entity,
): CraftingJob[] {
    const root = buildingEntity.getRootEntity();
    const claimed: CraftingJob[] = [];
    const unclaimed: CraftingJob[] = [];

    for (const [, jobQueue] of root.queryComponents(JobQueueComponentId)) {
        for (const job of jobQueue.jobs) {
            if (
                job.id === CraftingJobId &&
                job.targetBuilding === buildingEntity.id
            ) {
                if (job.claimedBy !== undefined) {
                    claimed.push(job);
                } else {
                    unclaimed.push(job);
                }
            }
        }
    }

    return [...claimed, ...unclaimed];
}

/**
 * Get the raw tick progress for a crafting job.
 * For unclaimed jobs returns 0. For claimed jobs, looks up the worker's
 * current craftItem action to read progress from BehaviorAgentComponent.
 */
export function getCraftingJobProgress(
    root: Entity,
    job: CraftingJob,
): number {
    if (!job.claimedBy) {
        return 0;
    }

    const worker = root.findEntity(job.claimedBy);
    if (!worker) {
        return 0;
    }

    const agent = worker.getEcsComponent(
        BehaviorAgentComponentId,
    ) as BehaviorAgentComponent | null;
    if (!agent) {
        return 0;
    }

    for (const action of agent.actionQueue) {
        if (
            action.type === "craftItem" &&
            action.buildingId === job.targetBuilding &&
            action.recipe.id === job.recipe.id
        ) {
            return action.progress ?? 0;
        }
    }

    return 0;
}

/**
 * Build display info for all crafting jobs targeting a building,
 * including resolved progress fractions for UI rendering.
 */
export function getCraftingJobDisplayInfos(
    buildingEntity: Entity,
): CraftingJobDisplayInfo[] {
    const root = buildingEntity.getRootEntity();
    const jobs = getCraftingJobsForBuilding(buildingEntity);

    return jobs.map((job) => {
        const rawProgress = getCraftingJobProgress(root, job);
        const progressFraction =
            job.recipe.duration > 0 ? rawProgress / job.recipe.duration : 0;
        return { job, progressFraction };
    });
}

/**
 * Cancel the first unclaimed crafting job matching the given building and recipe.
 * Uses FIFO ordering — the earliest queued job is removed.
 * Returns true if a job was cancelled, false if none matched.
 */
export function cancelCraftingJob(
    root: Entity,
    buildingId: string,
    recipeId: string,
): boolean {
    for (const [entity, jobQueue] of root.queryComponents(
        JobQueueComponentId,
    )) {
        const index = jobQueue.jobs.findIndex(
            (job) =>
                job.id === CraftingJobId &&
                job.targetBuilding === buildingId &&
                job.recipe.id === recipeId &&
                job.claimedBy === undefined,
        );

        if (index !== -1) {
            jobQueue.jobs.splice(index, 1);
            entity.invalidateComponent(JobQueueComponentId);
            return true;
        }
    }

    return false;
}

/**
 * Remove all unclaimed crafting jobs targeting the given building.
 * Claimed jobs (worker committed) are left untouched.
 * Returns the count of jobs removed.
 */
export function clearUnclaimedCraftingJobs(
    root: Entity,
    buildingId: string,
): number {
    let removed = 0;

    for (const [entity, jobQueue] of root.queryComponents(
        JobQueueComponentId,
    )) {
        const before = jobQueue.jobs.length;
        jobQueue.jobs = jobQueue.jobs.filter(
            (job) =>
                !(
                    job.id === CraftingJobId &&
                    job.targetBuilding === buildingId &&
                    job.claimedBy === undefined
                ),
        );
        const after = jobQueue.jobs.length;
        const delta = before - after;
        if (delta > 0) {
            removed += delta;
            entity.invalidateComponent(JobQueueComponentId);
        }
    }

    return removed;
}
