import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import type { Entity } from "../../entity/entity.ts";
import type { Jobs } from "../job.ts";
import { removeJobForWorker } from "../jobLifecycle.ts";

/**
 * Plan a trip to the job's building followed by the work done there. When the
 * building is gone there is nothing left to walk to, so the job is retired
 * instead of sending the worker to an empty tile.
 */
export function planWorkAtBuilding(
    root: Entity,
    worker: Entity,
    job: Jobs & { targetBuilding: string },
    workAtBuilding: BehaviorActionData[],
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.targetBuilding);
    if (!buildingEntity) {
        removeJobForWorker(worker, job);
        return [];
    }

    return [
        {
            type: "moveTo",
            target: buildingEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        ...workAtBuilding,
    ];
}
