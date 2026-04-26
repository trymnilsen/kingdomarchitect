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
import { ChunkMapComponentId, getEntitiesAt } from "../../component/chunkMapComponent.ts";
import { getInventoryItemById } from "../../../data/inventory/inventoryItemHelpers.ts";
import type { Entity } from "../../entity/entity.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import {
    completeJobFromQueue,
    findJobClaimedBy,
} from "../../job/jobLifecycle.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./Action.ts";

export type WorkWindmillActionData = {
    type: "workWindmill";
    windmillId: string;
};

const log = createLogger("behavior");

const ADJACENT_OFFSETS: ReadonlyArray<{ dx: number; dy: number }> = [
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
];

/**
 * Work a windmill: each tick scan the 8 adjacent tiles for farms,
 * plant any that are Empty, and once nothing is Growing harvest all Ready
 * farms into the worker's inventory and complete the job.
 *
 * One job represents one full plant + harvest pass. Farms that were already
 * Growing or Ready when the action began are rolled into the same pass.
 */
export function executeWorkWindmillAction(
    action: WorkWindmillActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const root = entity.getRootEntity();
    const windmillEntity = root.findEntity(action.windmillId);

    if (!windmillEntity) {
        log.warn(`Windmill ${action.windmillId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.windmillId },
        };
    }

    if (
        !isPointAdjacentTo(windmillEntity.worldPosition, entity.worldPosition)
    ) {
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const chunkMapComponent = root.getEcsComponent(ChunkMapComponentId);
    if (!chunkMapComponent) {
        log.warn("ChunkMap component missing on root");
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const windmillPos = windmillEntity.worldPosition;
    const adjacentFarms: Entity[] = [];
    for (const offset of ADJACENT_OFFSETS) {
        const tileEntities = getEntitiesAt(
            chunkMapComponent.chunkMap,
            windmillPos.x + offset.dx,
            windmillPos.y + offset.dy,
        );
        for (const candidate of tileEntities) {
            if (candidate.getEcsComponent(FarmComponentId)) {
                adjacentFarms.push(candidate);
            }
        }
    }

    if (adjacentFarms.length === 0) {
        return { kind: "failed", cause: { type: "unknown" } };
    }

    let growingCount = 0;
    for (const farmEntity of adjacentFarms) {
        const farm = farmEntity.getEcsComponent(FarmComponentId);
        if (!farm) continue;

        if (farm.state === FarmState.Empty) {
            farm.state = FarmState.Growing;
            farm.plantedAtTick = tick;
            farmEntity.invalidateComponent(FarmComponentId);
            growingCount++;
        } else if (farm.state === FarmState.Growing) {
            growingCount++;
        }
    }

    if (growingCount > 0) {
        return ActionRunning;
    }

    const workerInventory = entity.requireEcsComponent(InventoryComponentId);
    let harvestedAny = false;
    for (const farmEntity of adjacentFarms) {
        const farm = farmEntity.getEcsComponent(FarmComponentId);
        if (!farm || farm.state !== FarmState.Ready) continue;

        const cropItem = getInventoryItemById(farm.cropItemId);
        if (!cropItem) {
            log.warn(`Unknown crop item id: ${farm.cropItemId}`);
            continue;
        }

        addInventoryItem(workerInventory, cropItem, farm.cropYieldAmount);
        farm.state = FarmState.Empty;
        farm.plantedAtTick = 0;
        farmEntity.invalidateComponent(FarmComponentId);
        harvestedAny = true;
    }

    if (harvestedAny) {
        entity.invalidateComponent(InventoryComponentId);
    }

    const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        const job = findJobClaimedBy(queueEntity, entity.id);
        if (job) {
            completeJobFromQueue(queueEntity, job);
        }
    }

    return ActionComplete;
}
