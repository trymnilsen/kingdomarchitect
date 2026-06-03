import { log } from "../../../common/logging/logger.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import type { Entity } from "../../entity/entity.ts";
import type { DismantleBuildingJob } from "../dismantleBuildingJob.ts";

/**
 * Plan actions for dismantling a building: walk adjacent and drain its HP.
 * Simpler than the build planner — no materials to gather. If the building is
 * already gone, return no actions so the job is dropped.
 */
export function planDismantleBuilding(
    root: Entity,
    _worker: Entity,
    job: DismantleBuildingJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.entityId);
    if (!buildingEntity) {
        log.warn("Dismantle target not found", { entityId: job.entityId });
        return [];
    }

    return [
        {
            type: "moveTo",
            target: buildingEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        { type: "dismantleBuilding", entityId: job.entityId },
    ];
}
