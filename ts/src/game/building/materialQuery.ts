import { distance, type Point } from "../../common/point.ts";
import type { BuildingRequirements } from "../../data/building/building.ts";
import type { InventoryItem, ItemRarity } from "../../data/inventory/inventoryItem.ts";
import { inventoryItemsMap } from "../../data/inventory/inventoryItems.ts";
import {
    getInventoryItem,
    InventoryComponentId,
    type InventoryComponent,
} from "../component/inventoryComponent.ts";
import { StockpileComponentId } from "../component/stockpileComponent.ts";
import type { Entity } from "../entity/entity.ts";

export type MaterialSource = {
    entity: Entity;
    position: Point;
    item: InventoryItem;
    availableAmount: number;
};

export type MaterialRequirement = {
    itemId: string;
    item: InventoryItem;
    amountNeeded: number;
    amountInWorkerInventory: number;
    amountInStockpiles: number;
    sources: MaterialSource[];
};

export type MaterialCheckResult = {
    requirements: MaterialRequirement[];
    allMaterialsAvailable: boolean;
    missingMaterials: MaterialRequirement[];
    materialsToFetch: MaterialRequirement[];
};

/**
 * Find all stockpile buildings in the settlement that have inventory components
 */
export function findStockpiles(root: Entity): Entity[] {
    const stockpiles: Entity[] = [];
    const stockpileComponents = root.queryComponents(StockpileComponentId);

    for (const [entity] of stockpileComponents) {
        if (entity.getEcsComponent(InventoryComponentId)) {
            stockpiles.push(entity);
        }
    }

    return stockpiles;
}

/**
 * Get total amount of an item available across all stockpiles
 */
export function getTotalItemInStockpiles(
    root: Entity,
    itemId: string,
    rarity?: ItemRarity,
): number {
    const stockpiles = findStockpiles(root);
    let total = 0;

    for (const stockpile of stockpiles) {
        const inventory = stockpile.getEcsComponent(InventoryComponentId);
        if (inventory) {
            const item = getInventoryItem(inventory, itemId, rarity);
            if (item) {
                total += item.amount;
            }
        }
    }

    return total;
}

/**
 * Find all stockpiles that have a specific item, sorted by distance from a point
 */
export function findStockpilesWithItem(
    root: Entity,
    itemId: string,
    fromPosition: Point,
    rarity?: ItemRarity,
): MaterialSource[] {
    const stockpiles = findStockpiles(root);
    const sources: MaterialSource[] = [];
    const item = inventoryItemsMap[itemId as keyof typeof inventoryItemsMap];

    if (!item) {
        return sources;
    }

    for (const stockpile of stockpiles) {
        const inventory = stockpile.getEcsComponent(InventoryComponentId);
        if (inventory) {
            const inventoryItem = getInventoryItem(inventory, itemId, rarity);
            if (inventoryItem && inventoryItem.amount > 0) {
                sources.push({
                    entity: stockpile,
                    position: stockpile.worldPosition,
                    item: item,
                    availableAmount: inventoryItem.amount,
                });
            }
        }
    }

    // Sort by distance from the given position
    sources.sort(
        (a, b) => distance(fromPosition, a.position) - distance(fromPosition, b.position),
    );

    return sources;
}

/**
 * Check what materials a worker has and what needs to be fetched for a building
 */
export function checkMaterialsForBuilding(
    root: Entity,
    workerEntity: Entity,
    requirements: BuildingRequirements,
): MaterialCheckResult {
    const workerInventory = workerEntity.getEcsComponent(InventoryComponentId);
    const materialRequirements: MaterialRequirement[] = [];

    if (!requirements.materials) {
        return {
            requirements: [],
            allMaterialsAvailable: true,
            missingMaterials: [],
            materialsToFetch: [],
        };
    }

    for (const [itemId, amountNeeded] of Object.entries(requirements.materials)) {
        if (amountNeeded === undefined || amountNeeded <= 0) {
            continue;
        }

        const item = inventoryItemsMap[itemId as keyof typeof inventoryItemsMap];
        if (!item) {
            console.warn(`Unknown item ID in building requirements: ${itemId}`);
            continue;
        }

        // Check worker inventory
        let amountInWorkerInventory = 0;
        if (workerInventory) {
            const workerItem = getInventoryItem(workerInventory, itemId);
            if (workerItem) {
                amountInWorkerInventory = workerItem.amount;
            }
        }

        // Check stockpiles
        const sources = findStockpilesWithItem(
            root,
            itemId,
            workerEntity.worldPosition,
        );
        const amountInStockpiles = sources.reduce(
            (sum, source) => sum + source.availableAmount,
            0,
        );

        materialRequirements.push({
            itemId,
            item,
            amountNeeded,
            amountInWorkerInventory,
            amountInStockpiles,
            sources,
        });
    }

    const missingMaterials = materialRequirements.filter(
        (req) =>
            req.amountInWorkerInventory + req.amountInStockpiles < req.amountNeeded,
    );

    const materialsToFetch = materialRequirements.filter(
        (req) =>
            req.amountInWorkerInventory < req.amountNeeded &&
            req.amountInStockpiles > 0,
    );

    const allMaterialsAvailable = missingMaterials.length === 0;

    return {
        requirements: materialRequirements,
        allMaterialsAvailable,
        missingMaterials,
        materialsToFetch,
    };
}

/**
 * Check if all required materials for a building exist somewhere in the settlement.
 * This checks worker inventory + all stockpiles.
 */
export function canBuildingBeConstructed(
    root: Entity,
    workerEntity: Entity,
    requirements: BuildingRequirements | undefined,
): boolean {
    if (!requirements?.materials) {
        return true;
    }

    const result = checkMaterialsForBuilding(root, workerEntity, requirements);
    return result.allMaterialsAvailable;
}

/**
 * Log missing materials for debugging/telegraphing
 */
export function logMissingMaterials(
    buildingName: string,
    missingMaterials: MaterialRequirement[],
): void {
    if (missingMaterials.length === 0) {
        return;
    }

    console.log(`[BUILD] Cannot construct ${buildingName} - missing materials:`);
    for (const req of missingMaterials) {
        const totalAvailable =
            req.amountInWorkerInventory + req.amountInStockpiles;
        const deficit = req.amountNeeded - totalAvailable;
        console.log(
            `  - ${req.item.name}: need ${req.amountNeeded}, have ${totalAvailable} (missing ${deficit})`,
        );
    }
}

/**
 * Find the nearest stockpile that has materials the worker still needs
 */
export function findNearestStockpileForMaterials(
    _root: Entity,
    workerEntity: Entity,
    materialsToFetch: MaterialRequirement[],
): MaterialSource | null {
    if (materialsToFetch.length === 0) {
        return null;
    }

    // Collect all unique sources and sort by distance
    const allSources: MaterialSource[] = [];
    for (const req of materialsToFetch) {
        allSources.push(...req.sources);
    }

    if (allSources.length === 0) {
        return null;
    }

    // Sort by distance and return the nearest
    allSources.sort(
        (a, b) =>
            distance(workerEntity.worldPosition, a.position) -
            distance(workerEntity.worldPosition, b.position),
    );

    return allSources[0];
}

/**
 * Check if the worker has all required materials in their inventory
 */
export function workerHasAllMaterials(
    workerInventory: InventoryComponent | undefined,
    requirements: BuildingRequirements | undefined,
): boolean {
    if (!requirements?.materials) {
        return true;
    }

    if (!workerInventory) {
        return false;
    }

    for (const [itemId, amountNeeded] of Object.entries(requirements.materials)) {
        if (amountNeeded === undefined || amountNeeded <= 0) {
            continue;
        }

        const workerItem = getInventoryItem(workerInventory, itemId);
        if (!workerItem || workerItem.amount < amountNeeded) {
            return false;
        }
    }

    return true;
}
