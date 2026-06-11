import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/ActionData.ts";
import type { Building } from "../../../data/building/building.ts";
import { log } from "../../../common/logging/logger.ts";

import {
    InventoryComponentId,
    getInventoryItem,
    type InventoryComponent,
} from "../../component/inventoryComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
    type HeldItemComponent,
} from "../../component/heldItemComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import { distance } from "../../../common/point.ts";
import { buildingPrefab } from "../../prefab/buildingPrefab.ts";
import { findClosestAvailablePosition } from "../../map/query/closestPositionQuery.ts";
import { createCampBuildingPlacementValidator } from "../../camp/campBuildingPlacement.ts";
import { clearDecorativeResourcesAt } from "../../building/clearDecorativeResources.ts";
import { woodResourceItem } from "../../../data/inventory/items/resources.ts";
import { findDropPosition } from "../dropItem.ts";

/**
 * Plans building construction for goblins triggered by survival behaviors,
 * not the job system. Uses the held-item model: one material per trip,
 * staged into the building's inventory.
 */
export function planGoblinBuild(
    root: Entity,
    goblin: Entity,
    campEntity: Entity,
    building: Building,
): BehaviorActionData[] {
    const existingSite = findExistingBuildingSite(campEntity, building.id);
    if (!existingSite) {
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
    const buildPosition = findClosestAvailablePosition(
        root,
        campEntity.worldPosition,
        createCampBuildingPlacementValidator(root, campEntity, building),
    );

    if (!buildPosition) {
        log.warn(`No available position for building near camp`);
        return [];
    }

    clearDecorativeResourcesAt(root, buildPosition);
    const buildingEntity = buildingPrefab(building, true);
    campEntity.addChild(buildingEntity);
    buildingEntity.worldPosition = buildPosition;

    log.info(
        `Placed scaffolded ${building.name} at ${buildPosition.x}, ${buildPosition.y}`,
    );

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
    const buildingInventory =
        buildingEntity.getEcsComponent(InventoryComponentId);
    const goblinHeld = goblin.getEcsComponent(HeldItemComponentId);

    if (!goblinHeld) {
        log.warn(`Goblin has no held component`);
        return [];
    }

    const requirements = building.requirements?.materials ?? {};
    const remainingMaterials = buildingInventory
        ? getRemainingMaterials(buildingInventory, requirements)
        : { ...requirements };

    if (Object.keys(remainingMaterials).length === 0) {
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            { type: "constructBuilding", entityId: buildingEntity.id },
        ];
    }

    if (
        !isHeldEmpty(goblinHeld) &&
        remainingMaterials[goblinHeld.item!.id] !== undefined
    ) {
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            {
                type: "depositToInventory",
                targetEntityId: buildingEntity.id,
                itemId: goblinHeld.item!.id,
            },
        ];
    }

    if (!isHeldEmpty(goblinHeld)) {
        // Held has something the building doesn't need — drop it before fetching.
        const dropPos = findDropPosition(
            root,
            goblin.worldPosition,
            goblinHeld.item!,
        );
        if (!dropPos) return [];
        return [
            { type: "moveTo", target: dropPos },
            {
                type: "dropHeld",
                destination: dropPos,
                reason: `Dropped ${goblinHeld.item!.name} to make room for ${building.name} materials`,
            },
        ];
    }

    const stockpileWithMaterials = findCampStockpileWithMaterials(
        campEntity,
        remainingMaterials,
    );
    if (stockpileWithMaterials) {
        const inventory =
            stockpileWithMaterials.requireEcsComponent(InventoryComponentId);
        for (const [itemId, amountNeeded] of Object.entries(
            remainingMaterials,
        )) {
            const item = getInventoryItem(inventory, itemId);
            if (item && item.amount > 0) {
                const fetch = Math.min(item.amount, amountNeeded);
                return [
                    {
                        type: "moveTo",
                        target: stockpileWithMaterials.worldPosition,
                        stopAdjacent: "cardinal",
                    },
                    {
                        type: "withdrawFromStockpile",
                        stockpileId: stockpileWithMaterials.id,
                        itemId,
                        amount: fetch,
                    },
                    {
                        type: "moveTo",
                        target: buildingEntity.worldPosition,
                        stopAdjacent: "cardinal",
                    },
                    {
                        type: "depositToInventory",
                        targetEntityId: buildingEntity.id,
                        itemId,
                    },
                ];
            }
        }
    }

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

function findCampStockpileWithMaterials(
    campEntity: Entity,
    remainingMaterials: Record<string, number>,
): Entity | null {
    for (const child of campEntity.children) {
        if (!child.hasComponent(StockpileComponentId)) continue;
        const building = child.getEcsComponent(BuildingComponentId);
        if (building?.scaffolded) continue;
        const inventory = child.getEcsComponent(InventoryComponentId);
        if (!inventory) continue;
        for (const itemId of Object.keys(remainingMaterials)) {
            const item = getInventoryItem(inventory, itemId);
            if (item && item.amount > 0) return child;
        }
    }
    return null;
}

function planGatherMaterials(
    root: Entity,
    goblin: Entity,
    remainingMaterials: Record<string, number>,
): BehaviorActionData[] {
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
    log.warn(`No resources found to gather`);
    return [];
}

function findNearestChoppableResource(
    root: Entity,
    goblin: Entity,
): Entity | null {
    const resources = root.queryComponents(ResourceComponentId);
    let nearest: Entity | null = null;
    let nearestDist = Infinity;

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
