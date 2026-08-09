import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import { CollectableComponentId } from "../../component/collectableComponent.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { CollectItemJob } from "../collectItemJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

/**
 * Plan actions for collecting one stack from an entity with a
 * CollectableComponent.
 *
 * @example
 * // Typical return: [moveTo(entity), collectItems(entity, itemId)]
 */
export function planCollectItem(
    root: Entity,
    worker: Entity,
    job: CollectItemJob,
): BehaviorActionData[] {
    const targetEntity = root.findEntity(job.entityId);

    if (!targetEntity) {
        dropJob(worker, job);
        return [];
    }

    // The stack can be gone while the entity lives on: another worker took it,
    // or a building's output changed between queueing and planning. Nothing is
    // left to walk to, so retire the job here rather than send someone.
    const collectable = targetEntity.getEcsComponent(CollectableComponentId);
    const hasStack = collectable?.items.some(
        (stack) => stack.item.id === job.itemId,
    );
    if (!hasStack) {
        dropJob(worker, job);
        return [];
    }

    return [
        {
            type: "moveTo",
            target: targetEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        { type: "collectItems", entityId: job.entityId, itemId: job.itemId },
    ];
}

function dropJob(worker: Entity, job: CollectItemJob): void {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        failJobFromQueue(queueEntity, job);
    }
}
