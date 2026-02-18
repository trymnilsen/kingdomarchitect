import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import {
    GoblinCampComponentId,
    type GoblinCampComponent,
} from "../component/goblinCampComponent.ts";
import {
    GoblinUnitComponentId,
    createGoblinUnitComponent,
} from "../component/goblinUnitComponent.ts";
import { HousingComponentId } from "../component/housingComponent.ts";
import { FireSourceComponentId } from "../component/fireSourceComponent.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { StockpileComponentId } from "../component/stockpileComponent.ts";
import {
    JobQueueComponentId,
    type JobQueueComponent,
} from "../component/jobQueueComponent.ts";
import {
    BehaviorAgentComponentId,
    requestReplan,
} from "../component/BehaviorAgentComponent.ts";
import { goblinHut } from "../../data/building/goblin/goblinHut.ts";
import { stockPile } from "../../data/building/wood/storage.ts";
import { goblinPrefab } from "../prefab/goblinPrefab.ts";
import { buildingPrefab } from "../prefab/buildingPrefab.ts";
import { findClosestAvailablePosition } from "../map/query/closestPositionQuery.ts";
import { createBuildingPlacementValidator } from "../map/query/buildingPlacementValidator.ts";
import { BuildBuildingJob } from "../job/buildBuildingJob.ts";
import type { Building } from "../../data/building/building.ts";
import { firstChildWhere } from "../entity/child/first.ts";

/**
 * GoblinCampSystem handles all camp-level decisions:
 * - Spawning goblins when housing is available
 * - Expanding the camp by building new huts
 * - Building infrastructure (stockpiles)
 *
 * It issues BuildBuildingJobs into the camp's JobQueueComponent,
 * which goblins pick up via PerformJobBehavior.
 */
export const goblinCampSystem: EcsSystem = {
    onUpdate: (root: Entity, _tick: number) => {
        const camps = root.queryComponents(GoblinCampComponentId);

        for (const [campEntity, campComponent] of camps) {
            const population = getCampPopulation(root, campEntity.id);
            const hasActiveFire = campHasActiveFire(campEntity);
            const jobQueue = campEntity.getEcsComponent(JobQueueComponentId);

            if (jobQueue) {
                processInfrastructure(
                    root,
                    campEntity,
                    jobQueue,
                    population,
                );
                processExpansion(
                    root,
                    campEntity,
                    campComponent,
                    jobQueue,
                    population,
                    hasActiveFire,
                );
            }

            processSpawning(
                root,
                campEntity,
                campComponent,
                population,
                hasActiveFire,
            );
        }
    },
};

/**
 * Build a stockpile when population > 1 and no stockpile exists.
 */
function processInfrastructure(
    root: Entity,
    campEntity: Entity,
    jobQueue: JobQueueComponent,
    population: number,
): void {
    if (population <= 1) {
        return;
    }

    if (campHasStockpile(campEntity)) {
        return;
    }

    if (hasPendingBuildJobFor(jobQueue, stockPile.id, root)) {
        return;
    }

    placeScaffoldingAndQueueJob(root, campEntity, jobQueue, stockPile);
}

/**
 * Build huts to grow population when conditions allow.
 */
function processExpansion(
    root: Entity,
    campEntity: Entity,
    campComponent: GoblinCampComponent,
    jobQueue: JobQueueComponent,
    population: number,
    hasActiveFire: boolean,
): void {
    if (!hasActiveFire) {
        return;
    }

    if (population >= campComponent.maxPopulation) {
        return;
    }

    // Don't expand if there's a completed unoccupied hut
    if (findAvailableGoblinHut(campEntity)) {
        return;
    }

    // Don't expand if there's already a hut being built or queued
    if (hasScaffoldedBuilding(campEntity, goblinHut.id)) {
        return;
    }

    if (hasPendingBuildJobFor(jobQueue, goblinHut.id, root)) {
        return;
    }

    placeScaffoldingAndQueueJob(root, campEntity, jobQueue, goblinHut);
}

/**
 * Spawn goblins when camp has available housing, active fire,
 * and is below max population.
 */
function processSpawning(
    root: Entity,
    campEntity: Entity,
    campComponent: GoblinCampComponent,
    population: number,
    hasActiveFire: boolean,
): void {
    if (population >= campComponent.maxPopulation) {
        return;
    }

    if (!hasActiveFire) {
        return;
    }

    const availableHut = findAvailableGoblinHut(campEntity);
    if (!availableHut) {
        return;
    }

    const newGoblin = goblinPrefab();
    newGoblin.setEcsComponent(createGoblinUnitComponent(campEntity.id));

    const housing = availableHut.getEcsComponent(HousingComponentId);
    if (housing) {
        housing.tenant = newGoblin.id;
        availableHut.invalidateComponent(HousingComponentId);
    }

    const spawnPosition = findClosestAvailablePosition(
        root,
        availableHut.worldPosition,
    );
    if (!spawnPosition) {
        return;
    }

    campEntity.addChild(newGoblin);
    newGoblin.worldPosition = spawnPosition;

    console.log(
        `[GoblinCampSystem] Spawned goblin ${newGoblin.id} at camp ${campEntity.id}`,
    );
}

/**
 * Place a scaffolded building near the camp and queue a BuildBuildingJob.
 * Notifies an idle goblin to pick up the job.
 */
function placeScaffoldingAndQueueJob(
    root: Entity,
    campEntity: Entity,
    jobQueue: JobQueueComponent,
    building: Building,
): void {
    const buildPosition = findClosestAvailablePosition(
        root,
        campEntity.worldPosition,
        createBuildingPlacementValidator(root),
    );

    if (!buildPosition) {
        console.warn(
            `[GoblinCampSystem] No available position for ${building.name} near camp`,
        );
        return;
    }

    const buildingEntity = buildingPrefab(building, true);
    campEntity.addChild(buildingEntity);
    buildingEntity.worldPosition = buildPosition;

    const job = BuildBuildingJob(buildingEntity);
    jobQueue.jobs.push(job);
    campEntity.invalidateComponent(JobQueueComponentId);

    console.log(
        `[GoblinCampSystem] Placed scaffolded ${building.name} at ${buildPosition.x}, ${buildPosition.y} and queued build job`,
    );

    notifyIdleGoblin(campEntity);
}

function notifyIdleGoblin(campEntity: Entity): void {
    for (const child of campEntity.children) {
        if (child.hasComponent(BehaviorAgentComponentId)) {
            requestReplan(child);
            return;
        }
    }
}

function getCampPopulation(root: Entity, campEntityId: string): number {
    const goblins = root.queryComponents(GoblinUnitComponentId);
    let count = 0;
    for (const [_entity, goblinUnit] of goblins) {
        if (goblinUnit.campEntityId === campEntityId) {
            count++;
        }
    }
    return count;
}

function campHasActiveFire(campEntity: Entity): boolean {
    for (const child of campEntity.children) {
        const fireSource = child.getEcsComponent(FireSourceComponentId);
        if (fireSource?.isActive) {
            const building = child.getEcsComponent(BuildingComponentId);
            if (!building || !building.scaffolded) {
                return true;
            }
        }
    }
    return false;
}

function findAvailableGoblinHut(campEntity: Entity): Entity | null {
    for (const child of campEntity.children) {
        const building = child.getEcsComponent(BuildingComponentId);
        if (
            !building ||
            building.building.id !== goblinHut.id ||
            building.scaffolded
        ) {
            continue;
        }
        const housing = child.getEcsComponent(HousingComponentId);
        if (housing && !housing.tenant) {
            return child;
        }
    }
    return null;
}

function hasScaffoldedBuilding(
    campEntity: Entity,
    buildingId: string,
): boolean {
    for (const child of campEntity.children) {
        const building = child.getEcsComponent(BuildingComponentId);
        if (building?.building.id === buildingId && building.scaffolded) {
            return true;
        }
    }
    return false;
}

function campHasStockpile(campEntity: Entity): boolean {
    const stockpileEntity = firstChildWhere(campEntity, (entity) => {
        if (entity.hasComponent(StockpileComponentId)) {
            return true;
        }
        const building = entity.getEcsComponent(BuildingComponentId);
        if (building?.building.id === stockPile.id) {
            return true;
        }
        return false;
    });

    return !!stockpileEntity;
}

/**
 * Check if there's already a pending BuildBuildingJob for a specific
 * building type in the job queue.
 */
function hasPendingBuildJobFor(
    jobQueue: JobQueueComponent,
    buildingId: string,
    root: Entity,
): boolean {
    for (const job of jobQueue.jobs) {
        if (job.id !== "buildBuildingJob") {
            continue;
        }
        const buildingEntity = root.findEntity(job.entityId);
        if (!buildingEntity) {
            continue;
        }
        const building = buildingEntity.getEcsComponent(BuildingComponentId);
        if (building?.building.id === buildingId) {
            return true;
        }
    }
    return false;
}
