import type { Point } from "../../common/point.ts";
import { log } from "../../common/logging/logger.ts";
import { getInventoryItemById } from "../../data/inventory/inventoryItemHelpers.ts";
import { requestReplan } from "../component/BehaviorAgentComponent.ts";
import {
    BuildingComponentId,
    type BuildingComponent,
} from "../component/buildingComponent.ts";
import { InventoryComponentId } from "../component/inventoryComponent.ts";
import {
    JobQueueComponentId,
    type JobQueueComponent,
} from "../component/jobQueueComponent.ts";
import { OccupationComponentId } from "../component/occupationComponent.ts";
import { WorkplaceComponentId } from "../component/workplaceComponent.ts";
import { DropMode, dropItemAtPosition } from "../behavior/dropItem.ts";
import type { Entity } from "../entity/entity.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";
import {
    BuildBuildingJobId,
    updateAdjacentBuildingsAfterRemoval,
    type BuildBuildingJob,
} from "./buildBuildingJob.ts";
import { isTargetOfJob, type Job } from "./job.ts";

export const DismantleBuildingJobId = "dismantleBuildingJob";

export interface DismantleBuildingJob extends Job {
    id: typeof DismantleBuildingJobId;
    entityId: string;
}

export function createDismantleBuildingJob(
    entityId: string,
): DismantleBuildingJob {
    return {
        id: DismantleBuildingJobId,
        entityId,
    };
}

/**
 * Fraction of a completed building's construction materials returned when it is
 * dismantled. A single knob for all buildings — start at full refund; lower it
 * later (or make it per-building) if dismantling should cost something.
 */
export const DISMANTLE_REFUND_FRACTION = 1.0;

/**
 * True if the queue already holds a dismantle job for this building. Used to
 * keep the dismantle command idempotent.
 */
export function hasDismantleJobForBuilding(
    jobQueue: JobQueueComponent,
    buildingId: string,
): boolean {
    return jobQueue.jobs.some(
        (job) =>
            job.id === DismantleBuildingJobId &&
            (job as DismantleBuildingJob).entityId === buildingId,
    );
}

/**
 * Tear down a building once its HP has been drained to 0. The reverse of
 * finishConstruction(): scatter materials, evict occupants, clear jobs, and
 * remove the entity. Branches on whether the building was completed or still a
 * scaffold (which holds only its deposited construction materials).
 */
export function finishDismantle(root: Entity, buildingEntity: Entity): void {
    const buildingComponent =
        buildingEntity.getEcsComponent(BuildingComponentId);
    const position = { ...buildingEntity.worldPosition };

    // Drop whatever sits in the building's inventory: deposited construction
    // materials for a scaffold, stored goods for a completed building.
    scatterInventory(root, buildingEntity);

    if (buildingComponent && !buildingComponent.scaffolded) {
        refundConstructionMaterials(root, buildingComponent, position);
        evictWorkers(root, buildingEntity);
        // Tenant needs no handling: removing the building drops its
        // HousingComponent, and housingSystem rehouses the worker next tick.
        clearOtherJobsTargeting(buildingEntity);
    }

    const buildingId = buildingComponent?.building.id;
    buildingEntity.remove();

    if (buildingId) {
        updateAdjacentBuildingsAfterRemoval(root, position, buildingId);
    }
}

/**
 * Instantly cancel an untouched (0 HP) scaffold: scatter any materials that
 * were already delivered and remove the entity. No worker, no HP draining.
 */
export function cancelScaffold(root: Entity, buildingEntity: Entity): void {
    scatterInventory(root, buildingEntity);

    const buildingComponent =
        buildingEntity.getEcsComponent(BuildingComponentId);
    const buildingId = buildingComponent?.building.id;
    const position = { ...buildingEntity.worldPosition };

    buildingEntity.remove();

    if (buildingId) {
        updateAdjacentBuildingsAfterRemoval(root, position, buildingId);
    }
}

/**
 * Stop the in-flight construction of a scaffold before dismantling/cancelling
 * it. Removes the BuildBuildingJob (claimed or not) and forces its claimer to
 * replan, because constructBuildingAction keeps healing until full and would
 * otherwise fight the dismantle. The freed builder returns any fetched
 * materials to a stockpile via DepositHeldBehavior.
 */
export function stopConstruction(
    settlement: Entity,
    buildingEntity: Entity,
): void {
    const jobQueue = settlement.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        return;
    }

    let claimerId: string | undefined;
    const before = jobQueue.jobs.length;
    jobQueue.jobs = jobQueue.jobs.filter((job) => {
        if (
            job.id === BuildBuildingJobId &&
            (job as BuildBuildingJob).entityId === buildingEntity.id
        ) {
            if (job.claimedBy) {
                claimerId = job.claimedBy;
            }
            return false;
        }
        return true;
    });

    if (jobQueue.jobs.length !== before) {
        settlement.invalidateComponent(JobQueueComponentId);
    }

    if (claimerId) {
        const worker = buildingEntity.getRootEntity().findEntity(claimerId);
        if (worker) {
            requestReplan(worker);
        }
    }
}

function scatterInventory(root: Entity, buildingEntity: Entity): void {
    const inventory = buildingEntity.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        return;
    }

    for (const stack of [...inventory.items]) {
        if (stack.amount <= 0) {
            continue;
        }
        dropItemAtPosition(
            root,
            buildingEntity.worldPosition,
            structuredClone(stack.item),
            stack.amount,
            DropMode.Nearest,
        );
    }

    // No invalidate / clear: the building entity is removed right after, which
    // tears down its components anyway.
}

function refundConstructionMaterials(
    root: Entity,
    buildingComponent: BuildingComponent,
    position: Point,
): void {
    const materials = buildingComponent.building.requirements?.materials;
    if (!materials) {
        return;
    }

    for (const [itemId, amount] of Object.entries(materials)) {
        if (!amount || amount <= 0) {
            continue;
        }
        const refund = Math.floor(amount * DISMANTLE_REFUND_FRACTION);
        if (refund <= 0) {
            continue;
        }
        const item = getInventoryItemById(itemId);
        if (!item) {
            log.warn("Dismantle refund: unknown item, skipping", { itemId });
            continue;
        }
        dropItemAtPosition(
            root,
            position,
            structuredClone(item),
            refund,
            DropMode.Nearest,
        );
    }
}

function evictWorkers(root: Entity, buildingEntity: Entity): void {
    const workplace = buildingEntity.getEcsComponent(WorkplaceComponentId);
    if (!workplace) {
        return;
    }

    for (const workerId of workplace.workers) {
        const worker = root.findEntity(workerId);
        if (!worker) {
            continue;
        }
        const occupation = worker.getEcsComponent(OccupationComponentId);
        if (occupation && occupation.workplace === buildingEntity.id) {
            occupation.workplace = undefined;
            worker.invalidateComponent(OccupationComponentId);
        }
    }
    // The building's own WorkplaceComponent isn't cleared/invalidated: the
    // entity is removed right after, taking the component with it. Only the
    // workers' (surviving) OccupationComponent needs updating, done above.
}

function clearOtherJobsTargeting(buildingEntity: Entity): void {
    const settlement = getSettlementEntity(buildingEntity);
    const jobQueue = settlement.getEcsComponent(JobQueueComponentId);
    if (!jobQueue) {
        return;
    }

    const before = jobQueue.jobs.length;
    jobQueue.jobs = jobQueue.jobs.filter(
        (job) =>
            job.id === DismantleBuildingJobId ||
            !isTargetOfJob(job, buildingEntity),
    );

    if (jobQueue.jobs.length !== before) {
        settlement.invalidateComponent(JobQueueComponentId);
    }
}
