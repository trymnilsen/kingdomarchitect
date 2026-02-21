import type { BehaviorActionData, ItemTransfer } from "../../behavior/actions/Action.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import {
    getInventoryItem,
    InventoryComponentId,
    type InventoryComponent,
} from "../../component/inventoryComponent.ts";
import { StockpileComponentId } from "../../component/stockpileComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import { distance } from "../../../common/point.ts";
import { woodResourceItem } from "../../../data/inventory/items/resources.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BuildBuildingJob } from "../buildBuildingJob.ts";
import { GoblinUnitComponentId } from "../../component/goblinUnitComponent.ts";

/**
 * Goblin-specific build job planner. Unlike the player-worker planner,
 * goblins gather materials from the environment when stockpiles are empty.
 *
 * This planner handles job-assigned builds (from the camp job queue).
 * For survival-triggered builds (e.g. building a campfire when cold),
 * see goblinBuildPlanner.ts — that one also places scaffolding.
 *
 * Scaffolding placement is NOT handled here — the GoblinCampSystem does that
 * when it posts a build job to the camp queue. By the time this planner runs,
 * the scaffolded entity already exists in the world.
 *
 * Construction workflow:
 * 1. Building has all materials → moveTo + construct
 * 2. Goblin has materials → moveTo + deposit
 * 3. Camp stockpile has materials → moveTo + take
 * 4. Need to gather → find nearest tree → moveTo + harvest
 *    (only wood gathering is implemented; other materials stall silently)
 */
export function planGoblinBuildJob(
    root: Entity,
    worker: Entity,
    job: BuildBuildingJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.entityId);
    if (!buildingEntity) {
        console.warn(
            `[GoblinBuildJobPlanner] Building entity ${job.entityId} not found`,
        );
        return [];
    }

    const buildingComponent =
        buildingEntity.getEcsComponent(BuildingComponentId);
    if (!buildingComponent) {
        console.warn(
            `[GoblinBuildJobPlanner] Building ${job.entityId} has no BuildingComponent`,
        );
        return [];
    }

    const workerInventory = worker.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        console.warn(`[GoblinBuildJobPlanner] Goblin has no inventory`);
        return [];
    }

    const buildingInventory =
        buildingEntity.getEcsComponent(InventoryComponentId);

    const requirements =
        buildingComponent.building.requirements?.materials ?? {};
    const remainingMaterials = buildingInventory
        ? getRemainingMaterials(buildingInventory, requirements)
        : requirements;

    // State 1: Building ready to construct (all materials deposited)
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

    // State 2: Goblin has needed materials
    const materialsGoblinHas = getMaterialsWorkerHas(
        workerInventory,
        remainingMaterials,
    );
    if (Object.keys(materialsGoblinHas).length > 0) {
        const itemsToDeposit: ItemTransfer[] = Object.entries(
            materialsGoblinHas,
        ).map(([itemId, amount]) => ({ itemId, amount }));

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

    // State 3: Check camp stockpile for materials
    const campEntity = findCampEntity(worker, root);
    if (campEntity) {
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
    }

    // State 4: Gather materials from environment
    return planGatherMaterials(root, worker, remainingMaterials);
}

function findCampEntity(worker: Entity, root: Entity): Entity | null {
    const goblinUnit = worker.getEcsComponent(GoblinUnitComponentId);
    if (!goblinUnit) {
        return null;
    }
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

function getMaterialsWorkerHas(
    workerInventory: InventoryComponent,
    remainingMaterials: Record<string, number>,
): Record<string, number> {
    const has: Record<string, number> = {};
    for (const [itemId, amountNeeded] of Object.entries(remainingMaterials)) {
        const item = getInventoryItem(workerInventory, itemId);
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
            items.push({
                itemId,
                amount: Math.min(item.amount, amountNeeded),
            });
        }
    }
    return items;
}

// Tree resource IDs that can be chopped for wood.
// This list is duplicated from goblinBuildPlanner. There's no centralized
// "is choppable" flag on ResourceComponent yet — if adding a new tree type,
// update both planners until that's consolidated.
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

    console.warn(`[GoblinBuildJobPlanner] No resources found to gather`);
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
