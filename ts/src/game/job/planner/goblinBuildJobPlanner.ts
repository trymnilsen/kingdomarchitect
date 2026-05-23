import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import {
    getInventoryItem,
    InventoryComponentId,
    type InventoryComponent,
} from "../../component/inventoryComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import { distance } from "../../../common/point.ts";
import { woodResourceItem } from "../../../data/inventory/items/resources.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BuildBuildingJob } from "../buildBuildingJob.ts";
import { GoblinUnitComponentId } from "../../component/goblinUnitComponent.ts";
import { findDropPosition } from "../../behavior/dropItem.ts";
import { log } from "../../../common/logging/logger.ts";

/**
 * Goblin-specific build job planner under the held-item model.
 * Goblins haul one material at a time from camp stockpiles or from the
 * environment.
 */
export function planGoblinBuildJob(
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
        log.warn("Goblin has no held component");
        return [];
    }

    const buildingInventory =
        buildingEntity.getEcsComponent(InventoryComponentId);

    const requirements =
        buildingComponent.building.requirements?.materials ?? {};
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
        !isHeldEmpty(workerHeld) &&
        remainingMaterials[workerHeld.item!.id] !== undefined
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
                itemId: workerHeld.item!.id,
            },
        ];
    }

    if (!isHeldEmpty(workerHeld)) {
        const dropPos = findDropPosition(
            root,
            worker.worldPosition,
            workerHeld.item!,
        );
        if (!dropPos) return [];
        return [
            { type: "moveTo", target: dropPos },
            { type: "dropHeld", destination: dropPos },
        ];
    }

    const campEntity = findCampEntity(worker, root);
    if (campEntity) {
        const stockpileWithMaterials = findCampStockpileWithMaterials(
            campEntity,
            remainingMaterials,
        );
        if (stockpileWithMaterials) {
            const inventory =
                stockpileWithMaterials.requireEcsComponent(
                    InventoryComponentId,
                );
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
    }

    return planGatherMaterials(root, worker, remainingMaterials);
}

function findCampEntity(worker: Entity, root: Entity): Entity | null {
    const goblinUnit = worker.getEcsComponent(GoblinUnitComponentId);
    if (!goblinUnit) return null;
    return root.findEntity(goblinUnit.campEntityId);
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

const choppableResourceIds = [
    "tree1",
    "pineTree",
    "pineTreeSnow",
    "swampTree1",
    "swampTree2",
    "cactus1",
];

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
    log.warn("No resources found to gather");
    return [];
}

function findNearestChoppableResource(
    root: Entity,
    goblin: Entity,
): Entity | null {
    const resources = root.queryComponents(ResourceComponentId);
    let nearest: Entity | null = null;
    let nearestDist = Infinity;

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
