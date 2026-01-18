import type { Entity } from "../entity/entity.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { GoapAgentComponentId } from "../component/goapAgentComponent.ts";
import {
    createJobQueueComponent,
    JobQueueComponentId,
} from "../component/jobQueueComponent.ts";
import { getJobsByState, isJobClaimed } from "../job/job.ts";
import { requestReplan, ReplanUrgency } from "./goapReplanTrigger.ts";

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
 * @param tick - Current game tick
 * @param maxCheck - Maximum number of workers to check (budget)
 * @returns true if a worker was notified
 */
function notifyIdleWorkerWithBudget(
    root: Entity,
    tick: number,
    maxCheck: number = 10,
): boolean {
    const workers = root.queryComponents(GoapAgentComponentId);

    let checked = 0;
    for (const [entity, agent] of workers) {
        if (checked >= maxCheck) break; // Budget limit
        checked++;

        // Only notify workers with no claimed job
        if (!agent.claimedJob) {
            requestReplan(
                agent,
                ReplanUrgency.High,
                "job available in queue",
                tick,
            );
            //If the replan makes the agent claim a job, return
            if (!!agent.claimedJob) {
                return true; // Notified one worker, done
            }
        }
    }

    return false; // No idle worker found in budget
}
