import { isAtOrAdjacent } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import { FarmComponentId, FarmState } from "../../component/farmComponent.ts";
import {
    addToHeldItem,
    canAddToHeld,
    HeldItemComponentId,
} from "../../component/heldItemComponent.ts";
import {
    ChunkMapComponentId,
    getEntitiesAt,
} from "../../component/chunkMapComponent.ts";
import { getInventoryItemById } from "../../../data/inventory/inventoryItemHelpers.ts";
import { getCropDefinition } from "../../../data/crop/cropDefinitions.ts";
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

/**
 * Growth-speed multiplier applied to a farm while the windmill is actively
 * operated. The baseline farmGrowthSystem advances a growing crop by one tick
 * of progress each tick; the windmill credits the remaining (multiplier - 1)
 * ticks per tick it tends the farm, so a value of 3 means adjacent crops grow
 * at triple speed.
 */
const WINDMILL_GROWTH_MULTIPLIER = 3;

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
 * plant any that are Empty, accelerate the growth of any that are Growing
 * (see WINDMILL_GROWTH_MULTIPLIER), and once nothing is Growing harvest Ready
 * farms into the worker's held slot and complete the job.
 *
 * Held is single-slot, so this pass harvests one crop type only — whatever the
 * worker already holds, or the first Ready farm's crop if held is empty.
 * Farms with mismatched crops stay Ready for a later pass.
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

    if (!isAtOrAdjacent(windmillEntity.worldPosition, entity.worldPosition)) {
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
            // Credit the extra growth the windmill provides this tick by moving
            // the effective plant time backward, so elapsed growth advances
            // faster than wall-clock while the windmill is tended.
            farm.plantedAtTick -= WINDMILL_GROWTH_MULTIPLIER - 1;
            farmEntity.invalidateComponent(FarmComponentId);
            growingCount++;
        }
    }

    if (growingCount > 0) {
        return ActionRunning;
    }

    const heldItemComponent = entity.requireEcsComponent(HeldItemComponentId);
    let harvestedAny = false;
    for (const farmEntity of adjacentFarms) {
        const farm = farmEntity.getEcsComponent(FarmComponentId);
        if (!farm || farm.state !== FarmState.Ready) continue;

        const cropDefinition = getCropDefinition(farm.cropId);
        const cropItem = getInventoryItemById(cropDefinition.itemId);
        if (!cropItem) {
            log.warn(`Unknown crop item id: ${cropDefinition.itemId}`);
            continue;
        }

        if (!canAddToHeld(heldItemComponent, cropItem)) {
            continue;
        }

        addToHeldItem(heldItemComponent, cropItem, cropDefinition.yieldAmount);
        farm.state = FarmState.Empty;
        farm.plantedAtTick = 0;
        farmEntity.invalidateComponent(FarmComponentId);
        harvestedAny = true;
    }

    if (harvestedAny) {
        entity.invalidateComponent(HeldItemComponentId);
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
