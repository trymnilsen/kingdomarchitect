import type {
    BehaviorActionData,
    ItemTransfer,
} from "../../behavior/actions/Action.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
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
import { createLogger } from "../../../common/logging/logger.ts";

const log = createLogger("job");

function suspendJob(worker: Entity, job: BuildBuildingJob): void {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        suspendJobInQueue(queueEntity, job);
    }
}

/**
 * Plans actions for building construction.
 *
 * Evaluates the current state and returns actions up to the next decision point:
 * 1. Building has all materials: [moveTo(building), constructBuilding(building)]
 * 2. Worker has needed materials: [moveTo(building), depositToInventory(materials)]
 * 3. Materials in stockpile: [moveTo(stockpile), takeFromInventory(materials)]
 * 4. No materials available: suspends job and returns []
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
        log.warn("Building has no BuildingComponent", { entityId: job.entityId });
        return [];
    }

    const workerInventory = worker.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        log.warn("Worker has no inventory");
        return [];
    }

    const buildingInventory =
        buildingEntity.getEcsComponent(InventoryComponentId);
    const requirements = buildingComponent.building.requirements;

    // Buildings with no material requirements are not given a scaffold inventory
    // (there is nothing to deposit into them). Treat the absence of an inventory
    // as "nothing remaining" so the worker proceeds straight to construction.
    // If a building somehow has requirements but no inventory, that is a prefab
    // bug — log and bail rather than silently doing the wrong thing.
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

    // State 1: Building has all materials - go construct
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

    // Check if worker has any of the needed materials
    const workerHasMaterials = workerHasAnyMaterials(
        workerInventory,
        remainingMaterials,
    );

    // State 2: Worker has materials - go deposit them
    if (workerHasMaterials) {
        const itemsToDeposit: ItemTransfer[] = [];
        for (const [itemId, amountNeeded] of Object.entries(
            remainingMaterials,
        )) {
            const workerItem = getInventoryItem(workerInventory, itemId);
            if (workerItem && workerItem.amount > 0) {
                // Deposit up to what's needed
                const depositAmount = Math.min(workerItem.amount, amountNeeded);
                itemsToDeposit.push({ itemId, amount: depositAmount });
            }
        }

        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            {
                type: "depositToInventory",
                targetEntityId: job.entityId,
                items: itemsToDeposit,
            },
        ];
    }

    // State 3: Need to fetch materials from stockpile
    const settlement = getSettlementEntity(buildingEntity);
    const materialCheck = checkMaterialsAvailability(
        settlement,
        worker,
        remainingMaterials,
    );

    if (!materialCheck.allAvailable) {
        log.info("Missing materials for building", {
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
        log.info("Cannot find stockpile with required materials");
        suspendJob(worker, job);
        return [];
    }

    // Build list of items to take from stockpile
    const stockpileInventory =
        stockpileEntity.getEcsComponent(InventoryComponentId);
    if (!stockpileInventory) {
        suspendJob(worker, job);
        return [];
    }

    const itemsToTake: ItemTransfer[] = [];
    for (const { itemId, amount } of materialCheck.toFetch) {
        const stockpileItem = getInventoryItem(stockpileInventory, itemId);
        if (stockpileItem && stockpileItem.amount > 0) {
            const takeAmount = Math.min(stockpileItem.amount, amount);
            itemsToTake.push({ itemId, amount: takeAmount });
        }
    }

    if (itemsToTake.length === 0) {
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
            type: "takeFromInventory",
            sourceEntityId: stockpileEntity.id,
            items: itemsToTake,
        },
    ];
}
