import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { WindmillJob } from "../windmillJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

/**
 * Plan actions for working a windmill.
 * The worker walks adjacent to the windmill, then runs workWindmill which
 * handles planting and harvesting the surrounding farms in place.
 */
export function planWindmill(
    root: Entity,
    worker: Entity,
    job: WindmillJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.targetBuilding);

    if (!buildingEntity) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    return [
        {
            type: "moveTo",
            target: buildingEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "workWindmill",
            windmillId: job.targetBuilding,
        },
    ];
}
