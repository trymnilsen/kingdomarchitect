import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
import type { CollectItemJob } from "../collectItemJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

/**
 * Plan actions for collecting items from an entity with CollectableComponent.
 *
 * @example
 * // Typical return: [moveTo(entity), collectItems(entity)]
 */
export function planCollectItem(
    root: Entity,
    _worker: Entity,
    job: CollectItemJob,
): BehaviorActionData[] {
    const targetEntity = root.findEntity(job.entityId);

    if (!targetEntity) {
        failJobFromQueue(root, job);
        return [];
    }

    return [
        {
            type: "moveTo",
            target: targetEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        { type: "collectItems", entityId: job.entityId },
    ];
}
