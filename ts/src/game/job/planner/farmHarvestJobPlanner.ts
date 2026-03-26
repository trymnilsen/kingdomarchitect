import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import type { Entity } from "../../entity/entity.ts";
import type { FarmHarvestJob } from "../farmHarvestJob.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

export function planFarmHarvest(
    root: Entity,
    worker: Entity,
    job: FarmHarvestJob,
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
            type: "harvestCrop",
            buildingId: job.targetBuilding,
        },
    ];
}
