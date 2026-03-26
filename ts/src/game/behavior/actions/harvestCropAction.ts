import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    FarmComponentId,
    FarmState,
} from "../../component/farmComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import { getInventoryItemById } from "../../../data/inventory/inventoryItemHelpers.ts";
import type { Entity } from "../../entity/entity.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import {
    completeJobFromQueue,
    findJobClaimedBy,
} from "../../job/jobLifecycle.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type HarvestCropActionData = {
    type: "harvestCrop";
    buildingId: string;
};

const log = createLogger("behavior");

export function executeHarvestCropAction(
    action: HarvestCropActionData,
    entity: Entity,
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

    // Another worker may have already harvested — complete without changing state
    if (farm.state !== FarmState.Ready) {
        const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            const job = findJobClaimedBy(queueEntity, entity.id);
            if (job) {
                completeJobFromQueue(queueEntity, job);
            }
        }
        return ActionComplete;
    }

    const cropItem = getInventoryItemById(farm.cropItemId);
    if (!cropItem) {
        log.warn(`Unknown crop item id: ${farm.cropItemId}`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const workerInventory = entity.requireEcsComponent(InventoryComponentId);
    addInventoryItem(workerInventory, cropItem, farm.cropYieldAmount);
    entity.invalidateComponent(InventoryComponentId);

    farm.state = FarmState.Empty;
    farm.plantedAtTick = 0;
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
