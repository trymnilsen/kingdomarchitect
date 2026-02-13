import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
import type { CollectResourceJob } from "../collectResourceJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

/**
 * Plan actions for collecting a resource.
 * Returns: [moveTo resource, harvestResource]
 */
export function planCollectResource(
    root: Entity,
    _worker: Entity,
    job: CollectResourceJob,
): BehaviorActionData[] {
    const resourceEntity = root.findEntity(job.entityId);

    if (!resourceEntity) {
        failJobFromQueue(root, job);
        return [];
    }

    return [
        { type: "moveTo", target: resourceEntity.worldPosition },
        {
            type: "harvestResource",
            entityId: job.entityId,
            harvestAction: job.harvestAction,
        },
    ];
}
