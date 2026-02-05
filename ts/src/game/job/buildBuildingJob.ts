import { distance, isPointAdjacentTo, type Point } from "../../common/point.ts";
import { buildingAdjecency } from "../../data/building/buildings.ts";
import type { BuildingRequirements } from "../../data/building/building.ts";
import {
    type AdjacencyMask,
    adjacencyMaskToEnum,
    createAdjacencyMask,
} from "../../common/adjacency.ts";
import { queryAdjacentEntities } from "../map/query/queryEntity.ts";
import {
    BuildingComponentId,
    type BuildingComponent,
} from "../component/buildingComponent.ts";
import { heal, HealthComponentId } from "../component/healthComponent.ts";
import { SpriteComponentId } from "../component/spriteComponent.ts";
import {
    addInventoryItem,
    getInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
    type InventoryComponent,
} from "../component/inventoryComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { completeJob, suspendJob, type Job, type JobHandler } from "./job.ts";
import { doMovement, MovementResult } from "./movementHelper.ts";
import {
    findStockpiles,
    canBuildingBeConstructed,
} from "../building/materialQuery.ts";
import {
    calculateBuildingQuality,
    getRarityName,
} from "../building/buildingQuality.ts";

export interface BuildBuildingJob extends Job {
    id: typeof BuildBuildingJobId;
    entityId: string;
}

export function BuildBuildingJob(entity: Entity): BuildBuildingJob {
    return {
        id: BuildBuildingJobId,
        state: "pending",
        entityId: entity.id,
    };
}

/**
 * Check if a build job can be executed (materials exist in settlement)
 */
export function canExecuteBuildJob(
    root: Entity,
    job: BuildBuildingJob,
    workerEntity: Entity,
): boolean {
    const buildingEntity = root.findEntity(job.entityId);
    if (!buildingEntity) {
        return false;
    }

    const buildingComponent =
        buildingEntity.getEcsComponent(BuildingComponentId);
    if (!buildingComponent) {
        return false;
    }

    const requirements = buildingComponent.building.requirements;
    return canBuildingBeConstructed(root, workerEntity, requirements);
}

export const BuildBuildingJobId = "buildBuildingJob";

export const buildBuildingHandler: JobHandler<BuildBuildingJob> = (
    root,
    runner,
    job,
) => {
    const buildingEntity = root.findEntity(job.entityId);
    const buildingComponent =
        buildingEntity?.getEcsComponent(BuildingComponentId);

    if (!buildingEntity) {
        throw new Error(`Unable to find entity with entityId ${job.entityId}`);
    }

    if (!buildingComponent) {
        throw new Error(`No building component on entity ${job.entityId}`);
    }

    const requirements = buildingComponent.building.requirements;
    const workerInventory = runner.requireEcsComponent(InventoryComponentId);
    const buildingInventory =
        buildingEntity.requireEcsComponent(InventoryComponentId);
    const isAdjacentToBuilding = isPointAdjacentTo(
        buildingEntity.worldPosition,
        runner.worldPosition,
    );

    // Calculate what materials are still needed at the building
    const remainingMaterials = getRemainingMaterials(
        buildingInventory,
        requirements,
    );
    const buildingReady = Object.keys(remainingMaterials).length === 0;
    const workerHasMaterials = workerHasAnyMaterials(
        workerInventory,
        remainingMaterials,
    );

    // Case 1: Building has all materials, ready to construct
    if (isAdjacentToBuilding && buildingReady) {
        doConstruction(root, runner, buildingEntity, buildingComponent);
        return;
    }

    // Case 2: Worker has materials to deposit
    if (isAdjacentToBuilding && workerHasMaterials) {
        depositMaterials(runner, buildingEntity, remainingMaterials);
        return;
    }

    // Case 3: Worker has materials, move to building to deposit
    if (workerHasMaterials) {
        moveToBuilding(runner, buildingEntity);
        return;
    }

    // Case 4: Need to gather materials from stockpiles
    const materialCheck = checkMaterialsAvailability(
        root,
        runner,
        remainingMaterials,
    );

    if (!materialCheck.allAvailable) {
        console.log(
            `[BUILD] Missing materials for ${buildingComponent.building.name}: ${materialCheck.missing.join(", ")}`,
        );
        suspendJob(
            runner,
            `Missing materials for ${buildingComponent.building.name}`,
        );
        return;
    }

    // Find nearest stockpile with materials we need
    const stockpileEntity = findNearestStockpileWithMaterials(
        root,
        runner,
        materialCheck.toFetch,
    );

    if (!stockpileEntity) {
        suspendJob(runner, "Cannot find stockpile with required materials");
        return;
    }
    const isAdjacentToStockpile = isPointAdjacentTo(
        stockpileEntity.worldPosition,
        runner.worldPosition,
    );

    // Case 5: Adjacent to stockpile, take materials
    if (isAdjacentToStockpile) {
        takeMaterialsFromStockpile(runner, stockpileEntity, remainingMaterials);
        return;
    }

    // Case 6: Move to stockpile
    const movement = doMovement(runner, stockpileEntity.worldPosition);
    if (movement === MovementResult.Failure) {
        suspendJob(runner, "Cannot reach stockpile");
    }
};

type RemainingMaterials = Record<string, number>;

function getRemainingMaterials(
    buildingInventory: InventoryComponent,
    requirements: BuildingRequirements | undefined,
): RemainingMaterials {
    const remaining: RemainingMaterials = {};
    if (!requirements?.materials) return remaining;

    for (const [itemId, amountNeeded] of Object.entries(
        requirements.materials,
    )) {
        if (amountNeeded <= 0) continue;
        const item = getInventoryItem(buildingInventory, itemId);
        const amountAtBuilding = item?.amount ?? 0;
        const stillNeeded = amountNeeded - amountAtBuilding;
        if (stillNeeded > 0) {
            remaining[itemId] = stillNeeded;
        }
    }
    return remaining;
}

function workerHasAnyMaterials(
    workerInventory: InventoryComponent,
    remainingMaterials: RemainingMaterials,
): boolean {
    for (const itemId of Object.keys(remainingMaterials)) {
        const item = getInventoryItem(workerInventory, itemId);
        if (item && item.amount > 0) return true;
    }
    return false;
}

type MaterialAvailability = {
    allAvailable: boolean;
    missing: string[];
    toFetch: Array<{ itemId: string; amount: number }>;
};

function checkMaterialsAvailability(
    root: Entity,
    worker: Entity,
    remainingMaterials: RemainingMaterials,
): MaterialAvailability {
    const workerInventory = worker.requireEcsComponent(InventoryComponentId);
    const stockpiles = findStockpiles(root);
    const missing: string[] = [];
    const toFetch: Array<{ itemId: string; amount: number }> = [];

    for (const [itemId, amountNeeded] of Object.entries(remainingMaterials)) {
        const workerItem = getInventoryItem(workerInventory, itemId);
        const workerAmount = workerItem?.amount ?? 0;
        const stillNeeded = amountNeeded - workerAmount;

        if (stillNeeded <= 0) continue;

        // Check stockpiles for this material
        let availableInStockpiles = 0;
        for (const stockpile of stockpiles) {
            const inventory = stockpile.getEcsComponent(InventoryComponentId);
            if (inventory) {
                const stockpileItem = getInventoryItem(inventory, itemId);
                availableInStockpiles += stockpileItem?.amount ?? 0;
            }
        }

        if (availableInStockpiles >= stillNeeded) {
            toFetch.push({ itemId, amount: stillNeeded });
        } else if (availableInStockpiles > 0) {
            toFetch.push({ itemId, amount: availableInStockpiles });
            missing.push(itemId);
        } else {
            missing.push(itemId);
        }
    }

    return {
        allAvailable: missing.length === 0,
        missing,
        toFetch,
    };
}

function findNearestStockpileWithMaterials(
    root: Entity,
    worker: Entity,
    toFetch: Array<{ itemId: string; amount: number }>,
): Entity | null {
    if (toFetch.length === 0) return null;

    const stockpiles = findStockpiles(root);
    const itemIds = new Set(toFetch.map((m) => m.itemId));

    // Find stockpiles that have any of the needed materials
    const stockpilesWithMaterials: Array<{ entity: Entity; dist: number }> = [];

    for (const stockpile of stockpiles) {
        const inventory = stockpile.getEcsComponent(InventoryComponentId);
        if (!inventory) continue;

        const hasMaterial = [...itemIds].some((itemId) => {
            const item = getInventoryItem(inventory, itemId);
            return item && item.amount > 0;
        });

        if (hasMaterial) {
            const dist = distance(
                worker.worldPosition,
                stockpile.worldPosition,
            );
            stockpilesWithMaterials.push({ entity: stockpile, dist });
        }
    }

    if (stockpilesWithMaterials.length === 0) return null;

    // Return the nearest one
    stockpilesWithMaterials.sort((a, b) => a.dist - b.dist);
    return stockpilesWithMaterials[0].entity;
}

function depositMaterials(
    runner: Entity,
    buildingEntity: Entity,
    remainingMaterials: RemainingMaterials,
): void {
    const workerInventory = runner.requireEcsComponent(InventoryComponentId);
    const buildingInventory =
        buildingEntity.requireEcsComponent(InventoryComponentId);

    for (const [itemId, amountNeeded] of Object.entries(remainingMaterials)) {
        const taken = takeInventoryItem(workerInventory, itemId, amountNeeded);
        if (taken && taken.length > 0) {
            for (const takenItem of taken) {
                addInventoryItem(
                    buildingInventory,
                    takenItem.item,
                    takenItem.amount,
                );
            }
        }
    }

    runner.invalidateComponent(InventoryComponentId);
    buildingEntity.invalidateComponent(InventoryComponentId);
}

function takeMaterialsFromStockpile(
    runner: Entity,
    stockpileEntity: Entity,
    requirements: BuildingRequirements,
): void {
    if (!requirements.materials) return;

    const stockpileInventory =
        stockpileEntity.requireEcsComponent(InventoryComponentId);
    const workerInventory = runner.requireEcsComponent(InventoryComponentId);

    let tookSomething = false;
    for (const [itemId, amountNeeded] of Object.entries(
        requirements.materials,
    )) {
        if (!amountNeeded || amountNeeded <= 0) continue;

        const workerItem = getInventoryItem(workerInventory, itemId);
        const workerAmount = workerItem?.amount ?? 0;
        const stillNeed = amountNeeded - workerAmount;

        if (stillNeed <= 0) continue;

        const taken = takeInventoryItem(stockpileInventory, itemId, stillNeed);
        if (taken && taken.length > 0) {
            for (const takenItem of taken) {
                addInventoryItem(
                    workerInventory,
                    takenItem.item,
                    takenItem.amount,
                );
            }
            tookSomething = true;
        }
    }

    if (tookSomething) {
        stockpileEntity.invalidateComponent(InventoryComponentId);
        runner.invalidateComponent(InventoryComponentId);
    }
}

function moveToBuilding(runner: Entity, buildingEntity: Entity): void {
    const movement = doMovement(runner, buildingEntity.worldPosition);
    if (movement === MovementResult.Failure) {
        suspendJob(runner, "Cannot reach building");
    }
}

function doConstruction(
    root: Entity,
    runner: Entity,
    buildingEntity: Entity,
    buildingComponent: BuildingComponent,
): void {
    const healthComponent =
        buildingEntity.requireEcsComponent(HealthComponentId);
    heal(healthComponent, 10);
    buildingEntity.invalidateComponent(HealthComponentId);

    if (healthComponent.currentHp >= healthComponent.maxHp) {
        finishConstruction(root, buildingEntity, buildingComponent);
        completeJob(runner, root);
    }
}

function finishConstruction(
    root: Entity,
    buildingEntity: Entity,
    buildingComponent: BuildingComponent,
): void {
    const spriteComponent = buildingEntity.getEcsComponent(SpriteComponentId);
    buildingComponent.scaffolded = false;

    // Calculate building quality from deposited materials
    const buildingInventory =
        buildingEntity.requireEcsComponent(InventoryComponentId);
    const quality = calculateBuildingQuality(buildingInventory);
    buildingComponent.quality = quality;

    console.log(
        `[BUILD] ${buildingComponent.building.name} completed with ${getRarityName(quality)} quality`,
    );

    if (spriteComponent) {
        const adjacency = buildingAdjecency[buildingComponent.building.id];
        if (adjacency) {
            updateBuildingAdjacency(
                root,
                buildingEntity,
                buildingComponent.building.id,
            );
        } else {
            spriteComponent.sprite = buildingComponent.building.icon;
        }
    }

    buildingEntity.invalidateComponent(BuildingComponentId);
    buildingEntity.invalidateComponent(SpriteComponentId);
}

function calculateAdjacencyMask(
    root: Entity,
    position: Point,
    buildingId: string,
): AdjacencyMask {
    const adjacentEntities = queryAdjacentEntities(root, position);

    const hasMatchingBuilding = (entities: Entity[]): boolean => {
        return entities.some((entity) => {
            const bc = entity.getEcsComponent(BuildingComponentId);
            return bc && bc.building.id === buildingId && !bc.scaffolded;
        });
    };

    return createAdjacencyMask(
        hasMatchingBuilding(adjacentEntities.left),
        hasMatchingBuilding(adjacentEntities.right),
        hasMatchingBuilding(adjacentEntities.up),
        hasMatchingBuilding(adjacentEntities.down),
    );
}

function updateSingleBuildingAdjacency(
    entity: Entity,
    buildingId: string,
    root: Entity,
): void {
    const buildingComponent = entity.getEcsComponent(BuildingComponentId);
    const spriteComponent = entity.getEcsComponent(SpriteComponentId);
    const adjacencyFunction = buildingAdjecency[buildingId];

    if (!buildingComponent || !spriteComponent || !adjacencyFunction) {
        return;
    }

    const adjacencyMask = calculateAdjacencyMask(
        root,
        entity.worldPosition,
        buildingId,
    );
    const adjacencyEnum = adjacencyMaskToEnum(adjacencyMask);

    buildingComponent.adjacency = adjacencyEnum;
    spriteComponent.sprite = adjacencyFunction(adjacencyEnum);

    entity.invalidateComponent(BuildingComponentId);
    entity.invalidateComponent(SpriteComponentId);
}

function updateBuildingAdjacency(
    root: Entity,
    targetEntity: Entity,
    buildingId: string,
): void {
    updateSingleBuildingAdjacency(targetEntity, buildingId, root);

    const adjacentEntities = queryAdjacentEntities(
        root,
        targetEntity.worldPosition,
    );
    const allAdjacent = [
        ...adjacentEntities.left,
        ...adjacentEntities.right,
        ...adjacentEntities.up,
        ...adjacentEntities.down,
    ];

    for (const entity of allAdjacent) {
        const bc = entity.getEcsComponent(BuildingComponentId);
        if (bc && bc.building.id === buildingId && !bc.scaffolded) {
            updateSingleBuildingAdjacency(entity, buildingId, root);
        }
    }
}
