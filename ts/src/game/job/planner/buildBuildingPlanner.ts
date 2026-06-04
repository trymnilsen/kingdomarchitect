import { distance } from "../../../common/point.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { CollectableComponentId } from "../../component/collectableComponent.ts";
import { GroundItemComponentId } from "../../component/groundItemComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import {
    getInventoryItem,
    InventoryComponentId,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BuildBuildingJob } from "../buildBuildingJob.ts";
import {
    getRemainingMaterials,
    workerHasAnyMaterials,
    checkMaterialsAvailability,
    findNearestStockpileWithMaterials,
} from "../buildBuildingJob.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { suspendJobInQueue } from "../jobLifecycle.ts";
import { getSettlementEntity } from "../../entity/settlementQueries.ts";
import { findDropPosition } from "../../behavior/dropItem.ts";
import { log } from "../../../common/logging/logger.ts";

function suspendJob(worker: Entity, job: BuildBuildingJob): void {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        suspendJobInQueue(queueEntity, job);
    }
}

/**
 * Plan actions for building construction under the held-item model.
 *
 * State machine (one trip per planner call):
 * 1. Building has all materials → moveTo + constructBuilding.
 * 2. Worker held already matches a needed material → moveTo + deposit.
 * 3. A stockpile has a needed material → moveTo + withdraw.
 * 4. A ground pile has a needed material → moveTo + pickup.
 * 5. Held has something the building doesn't need → drop it first.
 * 6. Nothing fetchable → suspend.
 */
export function planBuildBuilding(
    root: Entity,
    worker: Entity,
    job: BuildBuildingJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.entityId);
    if (!buildingEntity) {
        log.warn("Building entity not found", { entityId: job.entityId });
        return [];
    }

    const buildingComponent =
        buildingEntity.getEcsComponent(BuildingComponentId);
    if (!buildingComponent) {
        log.warn("Building has no BuildingComponent", {
            entityId: job.entityId,
        });
        return [];
    }

    const workerHeld = worker.getEcsComponent(HeldItemComponentId);
    if (!workerHeld) {
        log.warn("Worker has no HeldItem component");
        return [];
    }

    const buildingInventory =
        buildingEntity.getEcsComponent(InventoryComponentId);
    const requirements = buildingComponent.building.requirements;

    if (!buildingInventory) {
        if (requirements?.materials) {
            log.warn("Building has requirements but no inventory", {
                entityId: job.entityId,
            });
            return [];
        }
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            { type: "constructBuilding", entityId: job.entityId },
        ];
    }

    const remainingMaterials = getRemainingMaterials(
        buildingInventory,
        requirements,
    );
    const buildingReady = Object.keys(remainingMaterials).length === 0;

    if (buildingReady) {
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            { type: "constructBuilding", entityId: job.entityId },
        ];
    }

    if (workerHasAnyMaterials(workerHeld, remainingMaterials)) {
        const itemId = workerHeld.item!.id;
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            {
                type: "depositToInventory",
                targetEntityId: job.entityId,
                itemId,
            },
        ];
    }

    if (!isHeldEmpty(workerHeld)) {
        const dropPos = findDropPosition(
            root,
            worker.worldPosition,
            workerHeld.item!,
        );
        if (!dropPos) {
            suspendJob(worker, job);
            return [];
        }
        return [
            { type: "moveTo", target: dropPos },
            {
                type: "dropHeld",
                destination: dropPos,
                reason: `Dropped ${workerHeld.item!.name} to make room for ${buildingComponent.building.name} materials`,
            },
        ];
    }

    const settlement = getSettlementEntity(buildingEntity);
    const materialCheck = checkMaterialsAvailability(
        settlement,
        worker,
        remainingMaterials,
    );

    if (!materialCheck.allAvailable) {
        // Stockpiles can't fully cover the deficit. See if a ground pile can.
        const itemIds = Object.keys(remainingMaterials);
        for (const itemId of itemIds) {
            const pile = findNearestGroundPileWithItem(
                root,
                worker.worldPosition,
                itemId,
            );
            if (pile) {
                return [
                    {
                        type: "moveTo",
                        target: pile.worldPosition,
                        stopAdjacent: "cardinal",
                    },
                    { type: "pickupFromGround", pileEntityId: pile.id },
                    {
                        type: "moveTo",
                        target: buildingEntity.worldPosition,
                        stopAdjacent: "cardinal",
                    },
                    {
                        type: "depositToInventory",
                        targetEntityId: job.entityId,
                        itemId,
                    },
                ];
            }
        }
        log.debug("Missing materials for building", {
            building: buildingComponent.building.name,
            missing: materialCheck.missing.join(", "),
        });
        suspendJob(worker, job);
        return [];
    }

    const stockpileEntity = findNearestStockpileWithMaterials(
        settlement,
        worker,
        materialCheck.toFetch,
    );

    if (!stockpileEntity) {
        suspendJob(worker, job);
        return [];
    }

    const stockpileInventory =
        stockpileEntity.getEcsComponent(InventoryComponentId);
    if (!stockpileInventory) {
        suspendJob(worker, job);
        return [];
    }

    // Pick the first item from toFetch that this stockpile actually carries
    // and fetch a single trip's worth.
    let chosenItemId: string | undefined;
    let chosenAmount = 0;
    for (const { itemId, amount } of materialCheck.toFetch) {
        const stockpileItem = getInventoryItem(stockpileInventory, itemId);
        if (stockpileItem && stockpileItem.amount > 0) {
            chosenItemId = itemId;
            chosenAmount = Math.min(stockpileItem.amount, amount);
            break;
        }
    }

    if (!chosenItemId) {
        suspendJob(worker, job);
        return [];
    }

    return [
        {
            type: "moveTo",
            target: stockpileEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "withdrawFromStockpile",
            stockpileId: stockpileEntity.id,
            itemId: chosenItemId,
            amount: chosenAmount,
        },
        {
            type: "moveTo",
            target: buildingEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "depositToInventory",
            targetEntityId: job.entityId,
            itemId: chosenItemId,
        },
    ];
}

function findNearestGroundPileWithItem(
    root: Entity,
    from: import("../../../common/point.ts").Point,
    itemId: string,
): Entity | null {
    const candidates = root.queryComponents(GroundItemComponentId);
    let best: Entity | null = null;
    let bestDistance = Infinity;
    for (const [entity] of candidates) {
        const collectable = entity.getEcsComponent(CollectableComponentId);
        if (!collectable) continue;
        const matches = collectable.items.some(
            (stack) => stack.item.id === itemId && stack.amount > 0,
        );
        if (!matches) continue;
        const d = distance(from, entity.worldPosition);
        if (d < bestDistance) {
            bestDistance = d;
            best = entity;
        }
    }
    return best;
}
