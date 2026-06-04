import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import type { ProductionJob } from "../productionJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";
import { getProductionDefinition } from "../../../data/production/productionDefinition.ts";
import {
    findRandomSpawnInDiamond,
    getDiamondPoints,
    getResourcesInDiamond,
} from "../../map/item/placement.ts";
import { ResourceHarvestMode } from "../../../data/inventory/items/naturalResource.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { planDepositHeld } from "./planDepositHeld.ts";

/**
 * Plan actions for operating a production facility.
 *
 * extract kind (quarry): [moveTo(building), operateFacility(building)]
 * zone kind (forrester):  [moveTo(emptySpot), plantTree(emptySpot, building)]
 */
export function planProduction(
    root: Entity,
    worker: Entity,
    job: ProductionJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.targetBuilding);

    if (!buildingEntity) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    const productionComp = buildingEntity.getEcsComponent(
        ProductionComponentId,
    );
    if (!productionComp) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    const definition = getProductionDefinition(productionComp.productionId);
    if (!definition) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    if (definition.kind === "extract") {
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            { type: "stepOnto", targetId: job.targetBuilding },
            { type: "operateFacility", buildingId: job.targetBuilding },
        ];
    }

    // zone kind: the worker auto-decides plant-vs-chop from the current tree
    // population. Plant up to a target count, then chop a random standing tree.
    const chunkMapComp = root.getEcsComponent(ChunkMapComponentId);
    if (!chunkMapComp) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    const center = buildingEntity.worldPosition;
    // Plantable tiles = diamond tiles minus the center (building) tile.
    const plantableTiles = getDiamondPoints(center, definition.zoneRadius).length - 1;
    const target = Math.round(definition.maxTreeFraction * plantableTiles);
    const floor = Math.floor(definition.minTreeFraction * plantableTiles);

    const trees = getResourcesInDiamond(
        center,
        definition.zoneRadius,
        chunkMapComp.chunkMap,
        definition.plantResourceId,
    );
    const treeCount = trees.length;

    // Plant while the population is still climbing toward the target.
    if (treeCount < target) {
        const emptySpot = findRandomSpawnInDiamond(
            center,
            definition.zoneRadius,
            chunkMapComp.chunkMap,
        );
        if (emptySpot) {
            return [
                {
                    type: "moveTo",
                    target: emptySpot,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "plantTree",
                    buildingId: job.targetBuilding,
                    targetPosition: emptySpot,
                },
            ];
        }
    }

    // At/above target (or no room to plant): chop a randomly-picked tree, as
    // long as we're above the safety floor so we never clear a sparse forest.
    if (treeCount >= floor && treeCount > 0) {
        const tree = trees[Math.floor(Math.random() * trees.length)];
        const chopActions: BehaviorActionData[] = [
            {
                type: "moveTo",
                target: tree.worldPosition,
                stopAdjacent: "cardinal",
            },
            {
                type: "harvestResource",
                entityId: tree.id,
                harvestAction: ResourceHarvestMode.Chop,
            },
        ];
        // Chopping deposits wood into the held slot, so free the hands first.
        const held = worker.getEcsComponent(HeldItemComponentId);
        if (held && !isHeldEmpty(held)) {
            return [...planDepositHeld(worker), ...chopActions];
        }
        return chopActions;
    }

    // Nothing to do (can't plant, can't chop) — drop the order.
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        failJobFromQueue(queueEntity, job);
    }
    return [];
}
