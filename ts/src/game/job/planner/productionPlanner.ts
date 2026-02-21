import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { ProductionJob } from "../productionJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

/**
 * Plan actions for operating a production facility.
 *
 * @example
 * // Typical return: [moveTo(building), operateFacility(building)]
 */
export function planProduction(
    root: Entity,
    worker: Entity,
    job: ProductionJob,
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
        { type: "operateFacility", buildingId: job.targetBuilding },
    ];
}
