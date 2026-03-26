import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import type { Entity } from "../../entity/entity.ts";
import type { FarmPlantJob } from "../farmPlantJob.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

export function planFarmPlant(
    root: Entity,
    worker: Entity,
    job: FarmPlantJob,
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
            type: "plantCrop",
            buildingId: job.targetBuilding,
        },
    ];
}
