import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import type { ProductionJob } from "../productionJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";
import { getProductionDefinition } from "../../../data/production/productionDefinition.ts";
import { findRandomSpawnInDiamond } from "../../map/item/placement.ts";

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

    const productionComp = buildingEntity.getEcsComponent(ProductionComponentId);
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
            { type: "operateFacility", buildingId: job.targetBuilding },
        ];
    }

    // zone kind: find an empty spot in the zone to plant
    const chunkMapComp = root.getEcsComponent(ChunkMapComponentId);
    if (!chunkMapComp) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    const emptySpot = findRandomSpawnInDiamond(
        buildingEntity.worldPosition,
        definition.zoneRadius,
        chunkMapComp.chunkMap,
    );

    if (!emptySpot) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    return [
        {
            type: "moveTo",
            target: emptySpot,
        },
        {
            type: "plantTree",
            buildingId: job.targetBuilding,
            targetPosition: emptySpot,
        },
    ];
}
