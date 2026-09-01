import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/actionData.ts";
import type { CollectResourceJob } from "../collectResourceJob.ts";
import { removeJobForWorker } from "../jobLifecycle.ts";

/**
 * Plan actions for collecting a resource.
 *
 * @example
 * // Typical return: [moveTo(resource), harvestResource(resource)]
 */
export function planCollectResource(
    root: Entity,
    worker: Entity,
    job: CollectResourceJob,
): BehaviorActionData[] {
    const resourceEntity = root.findEntity(job.entityId);

    if (!resourceEntity) {
        removeJobForWorker(worker, job);
        return [];
    }

    return [
        {
            type: "moveTo",
            target: resourceEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "harvestResource",
            entityId: job.entityId,
            harvestAction: job.harvestAction,
        },
    ];
}
