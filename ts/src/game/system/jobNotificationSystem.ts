import type { Entity } from "../entity/entity.ts";
import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import {
    BehaviorAgentComponentId,
    requestReplan as requestBehaviorReplan,
} from "../component/BehaviorAgentComponent.ts";
import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import { PlayerKingdomComponentId } from "../component/playerKingdomComponent.ts";

/**
 * Returns the player kingdom entity from the world root, or undefined if none exists.
 */
export function findPlayerKingdom(root: Entity): Entity | undefined {
    const results = root.queryComponents(PlayerKingdomComponentId);
    for (const [entity] of results) {
        return entity;
    }
    return undefined;
}

/**
 * Job notification system - notifies idle player workers about available jobs.
 *
 * Periodically checks the player kingdom's job queue for unclaimed jobs
 * and requests workers to replan, allowing them to pick up available work.
 */
export function createJobNotificationSystem(): EcsSystem {
    return {
        onUpdate: (root, tick) => {
            // Run every 5 ticks to avoid spam
            if (tick % 5 !== 0) return;

            const playerKingdom = findPlayerKingdom(root);
            if (!playerKingdom) return;

            const jobQueue =
                playerKingdom.getEcsComponent(JobQueueComponentId);
            if (!jobQueue) return;

            // Check if there are any unclaimed jobs
            const hasUnclaimedJobs = jobQueue.jobs.some(
                (job) => job.claimedBy === undefined,
            );

            if (hasUnclaimedJobs) {
                notifyIdleWorkerWithBudget(playerKingdom, tick, 10);
            }
        },
    };
}

/**
 * Immediately notify an idle worker about available jobs.
 * Call this when a player adds a job for instant response.
 *
 * @param settlement - The player kingdom entity to scope the search to
 */
export function notifyIdleWorkerForNewJob(
    settlement: Entity,
    tick: number,
): void {
    notifyIdleWorkerWithBudget(settlement, tick, 10);
}

/**
 * Find and notify one idle worker about available jobs.
 * Uses a budget to avoid checking all workers on large maps.
 *
 * @param settlement - Entity to scope the worker search to (player kingdom)
 * @param _tick - Current game tick (unused, kept for API compatibility)
 * @param maxCheck - Maximum number of workers to check (budget)
 * @returns true if a worker was notified
 */
function notifyIdleWorkerWithBudget(
    settlement: Entity,
    _tick: number,
    maxCheck: number = 10,
): boolean {
    const workers = settlement.queryComponents(BehaviorAgentComponentId);

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
