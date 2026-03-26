import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    FarmComponentId,
    FarmState,
} from "../../component/farmComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import {
    completeJobFromQueue,
    findJobClaimedBy,
} from "../../job/jobLifecycle.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./Action.ts";

export type PlantCropActionData = {
    type: "plantCrop";
    buildingId: string;
    workProgress?: number;
};

const PLANT_WORK_DURATION = 3;

const log = createLogger("behavior");

export function executePlantCropAction(
    action: PlantCropActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.buildingId);

    if (!buildingEntity) {
        log.warn(`Farm building ${action.buildingId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.buildingId },
        };
    }

    if (!isPointAdjacentTo(buildingEntity.worldPosition, entity.worldPosition)) {
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const farm = buildingEntity.getEcsComponent(FarmComponentId);
    if (!farm) {
        log.warn(`Building ${action.buildingId} has no FarmComponent`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    // Farm may have already been planted by another worker — complete without changing state
    if (farm.state !== FarmState.Empty) {
        const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            const job = findJobClaimedBy(queueEntity, entity.id);
            if (job) {
                completeJobFromQueue(queueEntity, job);
            }
        }
        return ActionComplete;
    }

    if (action.workProgress === undefined) {
        action.workProgress = 0;
    }
    action.workProgress++;

    if (action.workProgress >= PLANT_WORK_DURATION) {
        farm.state = FarmState.Growing;
        farm.plantedAtTick = tick;
        buildingEntity.invalidateComponent(FarmComponentId);

        const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            const job = findJobClaimedBy(queueEntity, entity.id);
            if (job) {
                completeJobFromQueue(queueEntity, job);
            }
        }
        return ActionComplete;
    }

    return ActionRunning;
}
