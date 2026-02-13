import type { Entity } from "../entity/entity.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import {
    BehaviorAgentComponentId,
    requestReplan as requestBehaviorReplan,
} from "../component/BehaviorAgentComponent.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../component/jobQueueComponent.ts";

/**
 * Job notification system - notifies idle workers about available jobs.
 *
 * Periodically checks for unclaimed jobs and requests workers to replan,
 * allowing them to pick up available work.
 */
export function createJobNotificationSystem(): EcsSystem {
    return {
        onInit: (root) => {
            root.setEcsComponent(createJobQueueComponent());
        },
        onUpdate: (root, tick) => {
            // Run every 5 ticks to avoid spam
            if (tick % 5 !== 0) return;

            const jobQueue = root.getEcsComponent(JobQueueComponentId);
            if (!jobQueue) return;

            // Check if there are any unclaimed jobs
            const hasUnclaimedJobs = jobQueue.jobs.some(
                (job) => job.claimedBy === undefined,
            );

            if (hasUnclaimedJobs) {
                notifyIdleWorkerWithBudget(root, tick, 10);
            }
        },
    };
}

/**
 * Immediately notify an idle worker about available jobs.
 * Call this when a player adds a job for instant response.
 */
export function notifyIdleWorkerForNewJob(root: Entity, tick: number): void {
    notifyIdleWorkerWithBudget(root, tick, 10);
}

/**
 * Find and notify one idle worker about available jobs.
 * Uses a budget to avoid checking all workers on large maps.
 *
 * @param root - Root entity
 * @param _tick - Current game tick (unused, kept for API compatibility)
 * @param maxCheck - Maximum number of workers to check (budget)
 * @returns true if a worker was notified
 */
function notifyIdleWorkerWithBudget(
    root: Entity,
    _tick: number,
    maxCheck: number = 10,
): boolean {
    const workers = root.queryComponents(BehaviorAgentComponentId);

    let checked = 0;
    for (const [entity, _agent] of workers) {
        if (checked >= maxCheck) break; // Budget limit
        checked++;

        // Request replan to make worker check for jobs
        requestBehaviorReplan(entity);

        // Note: We can't immediately check if job was claimed because
        // replan happens on next tick. This is fine - workers will claim
        // jobs during their next behavior evaluation.
        return true; // Notified one worker, done
    }

    return false; // No idle worker found in budget
}
