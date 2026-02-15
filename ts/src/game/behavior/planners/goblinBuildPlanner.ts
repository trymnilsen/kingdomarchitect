import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData, ItemTransfer } from "../actions/Action.ts";
import type { Building } from "../../../data/building/building.ts";
import {
    InventoryComponentId,
    getInventoryItem,
    type InventoryComponent,
} from "../../component/inventoryComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import { distance } from "../../../common/point.ts";
import { buildingPrefab } from "../../prefab/buildingPrefab.ts";
import { findClosestAvailablePosition } from "../../map/query/closestPositionQuery.ts";
import { createBuildingPlacementValidator } from "../../map/query/buildingPlacementValidator.ts";
import { woodResourceItem } from "../../../data/inventory/items/resources.ts";

/**
 * Plans building construction for goblins.
 * Unlike player workers, goblins gather materials themselves.
 *
 * State evaluation order:
 * 1. Building site exists with all materials -> construct
 * 2. Building site exists, goblin has materials -> deposit
 * 3. Building site exists, stockpile has materials -> fetch from stockpile
 * 4. Building site exists, need materials -> gather from environment
 * 5. No building site -> place scaffolding
 */
export function planGoblinBuild(
    root: Entity,
    goblin: Entity,
    campEntity: Entity,
    building: Building,
): BehaviorActionData[] {
    // Find existing scaffolded building of this type
    const existingSite = findExistingBuildingSite(campEntity, building.id);

    if (!existingSite) {
        // Need to place new building site
        return planPlaceBuildingSite(root, goblin, campEntity, building);
    }

    return planConstructExistingBuilding(
        root,
        goblin,
        campEntity,
        existingSite,
        building,
    );
}


function findExistingBuildingSite(
    campEntity: Entity,
    buildingId: string,
): Entity | null {
    for (const child of campEntity.children) {
        const buildingComponent = child.getEcsComponent(BuildingComponentId);
        if (
            buildingComponent?.building.id === buildingId &&
            buildingComponent.scaffolded
        ) {
            return child;
        }
    }
    return null;
}

function planPlaceBuildingSite(
    root: Entity,
    goblin: Entity,
    campEntity: Entity,
    building: Building,
): BehaviorActionData[] {
    // Find position near camp for new building
    const buildPosition = findClosestAvailablePosition(
        root,
        campEntity.worldPosition,
        createBuildingPlacementValidator(root),
    );

    if (!buildPosition) {
        console.warn(
            `[GoblinBuildPlanner] No available position for building near camp`,
        );
        return [];
    }

    // Create scaffolded building entity
    const buildingEntity = buildingPrefab(building, true);
    campEntity.addChild(buildingEntity);
    buildingEntity.worldPosition = buildPosition;

    console.log(
        `[GoblinBuildPlanner] Placed scaffolded ${building.name} at ${buildPosition.x}, ${buildPosition.y}`,
    );

    // Now plan to construct it
    return planConstructExistingBuilding(
        root,
        goblin,
        campEntity,
        buildingEntity,
        building,
    );
}

function planConstructExistingBuilding(
    root: Entity,
    goblin: Entity,
    campEntity: Entity,
    buildingEntity: Entity,
    building: Building,
): BehaviorActionData[] {
    const buildingInventory = buildingEntity.getEcsComponent(InventoryComponentId);
    const goblinInventory = goblin.getEcsComponent(InventoryComponentId);

    if (!goblinInventory) {
        console.warn(`[GoblinBuildPlanner] Goblin has no inventory`);
        return [];
    }

    // Buildings without requirements can be constructed immediately
    const requirements = building.requirements?.materials ?? {};
    const remainingMaterials = buildingInventory
        ? getRemainingMaterials(buildingInventory, requirements)
        : requirements;

    // State 1: Building ready to construct (all materials deposited)
    if (Object.keys(remainingMaterials).length === 0) {
        console.log(
            `[GoblinBuildPlanner] Goblin ${goblin.id} state=construct building ${buildingEntity.id}`,
        );
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            { type: "constructBuilding", entityId: buildingEntity.id },
        ];
    }

    // State 2: Goblin has needed materials
    const materialsGoblinHas = getMaterialsGoblinHas(
        goblinInventory,
        remainingMaterials,
    );
    if (Object.keys(materialsGoblinHas).length > 0) {
        const itemsToDeposit: ItemTransfer[] = Object.entries(materialsGoblinHas).map(
            ([itemId, amount]) => ({ itemId, amount }),
        );

        console.log(
            `[GoblinBuildPlanner] Goblin ${goblin.id} state=deposit materials to building ${buildingEntity.id}:`,
            materialsGoblinHas,
        );
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            {
                type: "depositToInventory",
                targetEntityId: buildingEntity.id,
                items: itemsToDeposit,
            },
        ];
    }

    // State 3: Check stockpile for materials
    const stockpileWithMaterials = findCampStockpileWithMaterials(
        campEntity,
        remainingMaterials,
    );
    if (stockpileWithMaterials) {
        const itemsToTake = getItemsToTakeFromStockpile(
            stockpileWithMaterials,
            remainingMaterials,
        );
        if (itemsToTake.length > 0) {
            console.log(
                `[GoblinBuildPlanner] Goblin ${goblin.id} state=fetch from stockpile ${stockpileWithMaterials.id}:`,
                itemsToTake,
            );
            return [
                {
                    type: "moveTo",
                    target: stockpileWithMaterials.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "takeFromInventory",
                    sourceEntityId: stockpileWithMaterials.id,
                    items: itemsToTake,
                },
            ];
        }
    }

    // State 4: Gather materials from environment
    console.log(
        `[GoblinBuildPlanner] Goblin ${goblin.id} state=gather materials from environment:`,
        remainingMaterials,
    );
    return planGatherMaterials(root, goblin, remainingMaterials);
}

function getRemainingMaterials(
    buildingInventory: InventoryComponent,
    requirements: Record<string, number>,
): Record<string, number> {
    const remaining: Record<string, number> = {};
    for (const [itemId, amountNeeded] of Object.entries(requirements)) {
        const item = getInventoryItem(buildingInventory, itemId);
        const have = item?.amount ?? 0;
        const needed = amountNeeded - have;
        if (needed > 0) {
            remaining[itemId] = needed;
        }
    }
    return remaining;
}

function getMaterialsGoblinHas(
    goblinInventory: InventoryComponent,
    remainingMaterials: Record<string, number>,
): Record<string, number> {
    const has: Record<string, number> = {};
    for (const [itemId, amountNeeded] of Object.entries(remainingMaterials)) {
        const item = getInventoryItem(goblinInventory, itemId);
        if (item && item.amount > 0) {
            has[itemId] = Math.min(item.amount, amountNeeded);
        }
    }
    return has;
}

function findCampStockpileWithMaterials(
    campEntity: Entity,
    remainingMaterials: Record<string, number>,
): Entity | null {
    for (const child of campEntity.children) {
        if (!child.hasComponent(StockpileComponentId)) {
            continue;
        }
        const building = child.getEcsComponent(BuildingComponentId);
        // Skip scaffolded stockpiles
        if (building?.scaffolded) {
            continue;
        }
        const inventory = child.getEcsComponent(InventoryComponentId);
        if (!inventory) {
            continue;
        }
        for (const itemId of Object.keys(remainingMaterials)) {
            const item = getInventoryItem(inventory, itemId);
            if (item && item.amount > 0) {
                return child;
            }
        }
    }
    return null;
}

function getItemsToTakeFromStockpile(
    stockpile: Entity,
    remainingMaterials: Record<string, number>,
): ItemTransfer[] {
    const inventory = stockpile.getEcsComponent(InventoryComponentId);
    if (!inventory) {
        return [];
    }

    const items: ItemTransfer[] = [];
    for (const [itemId, amountNeeded] of Object.entries(remainingMaterials)) {
        const item = getInventoryItem(inventory, itemId);
        if (item && item.amount > 0) {
            items.push({ itemId, amount: Math.min(item.amount, amountNeeded) });
        }
    }
    return items;
}

function planGatherMaterials(
    root: Entity,
    goblin: Entity,
    remainingMaterials: Record<string, number>,
): BehaviorActionData[] {
    // For wood, find nearest choppable tree
    if (remainingMaterials[woodResourceItem.id]) {
        const nearestTree = findNearestChoppableResource(root, goblin);
        if (nearestTree) {
            return [
                {
                    type: "moveTo",
                    target: nearestTree.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "harvestResource",
                    entityId: nearestTree.id,
                    harvestAction: ResourceHarvestMode.Chop,
                },
            ];
        }
    }

    console.warn(`[GoblinBuildPlanner] No resources found to gather`);
    return [];
}

function findNearestChoppableResource(root: Entity, goblin: Entity): Entity | null {
    const resources = root.queryComponents(ResourceComponentId);
    let nearest: Entity | null = null;
    let nearestDist = Infinity;

    // Tree resource IDs that can be chopped
    const choppableResourceIds = [
        "tree1",
        "pineTree",
        "pineTreeSnow",
        "swampTree1",
        "swampTree2",
        "cactus1",
    ];

    for (const [entity, resourceComponent] of resources) {
        if (!choppableResourceIds.includes(resourceComponent.resourceId)) {
            continue;
        }
        const dist = distance(goblin.worldPosition, entity.worldPosition);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = entity;
        }
    }

    return nearest;
}
