import { distance, type Point } from "../../common/point.ts";
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
import { SpriteComponentId } from "../component/spriteComponent.ts";
import {
    getInventoryItem,
    InventoryComponentId,
    type InventoryComponent,
} from "../component/inventoryComponent.ts";
import type { Entity } from "../entity/entity.ts";
import type { Job } from "./job.ts";
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

export type RemainingMaterials = Record<string, number>;

export function getRemainingMaterials(
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

export function workerHasAnyMaterials(
    workerInventory: InventoryComponent,
    remainingMaterials: RemainingMaterials,
): boolean {
    for (const itemId of Object.keys(remainingMaterials)) {
        const item = getInventoryItem(workerInventory, itemId);
        if (item && item.amount > 0) return true;
    }
    return false;
}

export type MaterialAvailability = {
    allAvailable: boolean;
    missing: string[];
    toFetch: Array<{ itemId: string; amount: number }>;
};

export function checkMaterialsAvailability(
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

export function findNearestStockpileWithMaterials(
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

export function finishConstruction(
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
