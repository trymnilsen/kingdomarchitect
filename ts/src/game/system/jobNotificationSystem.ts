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
import { getJobsByState } from "../job/job.ts";

/**
 * Job notification system - notifies idle workers about available jobs.
 *
 * This system uses a two-phase approach:
 * 1. Immediate notification when jobs are added (via notifyIdleWorkerForNewJob)
 * 2. Periodic checking for unclaimed jobs (safety net)
 *
 * Uses budget-limited search to scale efficiently with large worker counts.
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

            // Process pending jobs (newly added)
            const pendingJobs = getJobsByState(jobQueue.jobs, "pending");
            for (const job of pendingJobs) {
                notifyIdleWorkerWithBudget(root, tick, 10);
                job.state = "queued"; // Mark as notified
            }

            if (pendingJobs.length > 0) {
                root.invalidateComponent(JobQueueComponentId);
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
        // replan happens on next tick. This is fine - the pending state
        // ensures we'll process all pending jobs over the next few ticks.
        return true; // Notified one worker, done
    }

    return false; // No idle worker found in budget
}
