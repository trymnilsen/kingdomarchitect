import { CollectableComponentId } from "../component/collectableComponent.ts";
import type { JobQueueComponent } from "../component/jobQueueComponent.ts";
import { JobQueueComponentId } from "../component/jobQueueComponent.ts";
import { findPlayerKingdom } from "../component/playerKingdomComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { CollectItemJob, CollectItemJobId } from "./collectItemJob.ts";

/**
 * The haul jobs needed to empty a collectable: one per stack it is offering,
 * skipping any stack that already has a job waiting.
 *
 * A worker's held slot takes one item type per trip, so a collectable holding
 * two types is two jobs. Queueing them together is what lets one tap clear the
 * whole thing, and lets a different worker take each type.
 */
export function collectJobsForEntity(
    root: Entity,
    entity: Entity,
): CollectItemJob[] {
    const collectable = entity.getEcsComponent(CollectableComponentId);
    if (!collectable) {
        return [];
    }

    // Ground piles hang off the root rather than off the kingdom, so the queue
    // is looked up from the player kingdom instead of walked up to.
    const playerKingdom = findPlayerKingdom(root);
    const jobQueue = playerKingdom?.getEcsComponent(JobQueueComponentId);

    const jobs: CollectItemJob[] = [];
    for (const stack of collectable.items) {
        if (
            jobQueue &&
            hasPendingCollectJobFor(jobQueue, entity.id, stack.item.id)
        ) {
            continue;
        }
        jobs.push(CollectItemJob(entity, stack.item.id));
    }
    return jobs;
}

/**
 * Whether the queue already holds a job for this exact stack.
 *
 * Keeps a double tap from queueing the same haul twice. It is a guard against
 * queue noise rather than a correctness mechanism: this reads the client's
 * replicated queue while the server's queueJob handler appends unconditionally,
 * so a fast enough double tap still gets through. That is harmless, because
 * planCollectItem retires a job whose stack is gone before any worker walks.
 *
 * The (entity, item) pair identifies the work because a collectable never holds
 * two stacks of the same item id — same-type additions merge.
 */
function hasPendingCollectJobFor(
    jobQueue: JobQueueComponent,
    entityId: string,
    itemId: string,
): boolean {
    return jobQueue.jobs.some(
        (job) =>
            job.id === CollectItemJobId &&
            (job as CollectItemJob).entityId === entityId &&
            (job as CollectItemJob).itemId === itemId,
    );
}
