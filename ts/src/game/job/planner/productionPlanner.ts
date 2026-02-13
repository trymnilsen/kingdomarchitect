import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
import type { ProductionJob } from "../productionJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

/**
 * Plan actions for operating a production facility.
 * Returns: [moveTo building, operateFacility]
 */
export function planProduction(
    root: Entity,
    _worker: Entity,
    job: ProductionJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.targetBuilding);

    if (!buildingEntity) {
        failJobFromQueue(root, job);
        return [];
    }

    return [
        { type: "moveTo", target: buildingEntity.worldPosition },
        { type: "operateFacility", buildingId: job.targetBuilding },
    ];
}
