import { isPointAdjacentTo } from "../../../common/point.ts";
import { getProductionDefinition } from "../../../data/production/productionDefinition.ts";
import { getResourceById } from "../../../data/inventory/items/naturalResource.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    InventoryComponentId,
    addInventoryItem,
} from "../../component/inventoryComponent.ts";
import { JobRunnerComponentId } from "../../component/jobRunnerComponent.ts";
import { ProductionComponentId } from "../../component/productionComponent.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { completeJob, type JobHandler } from "../job.ts";
import { doMovement, MovementResult } from "../movementHelper.ts";
import type { ProductionJob } from "../productionJob.ts";
import { resourcePrefab } from "../../prefab/resourcePrefab.ts";
import { findRandomSpawnInDiamond } from "../../map/item/placement.ts";

const FORRESTER_RADIUS = 5;

export const productionJobHandler: JobHandler<ProductionJob> = (
    root,
    worker,
    job,
) => {
    const buildingEntity = root.findEntity(job.targetBuilding);

    if (!buildingEntity) {
        console.warn(
            `[ProductionJob] Unable to find building entity ${job.targetBuilding}`,
        );
        completeJob(worker, root);
        return;
    }

    const productionComp = buildingEntity.getEcsComponent(ProductionComponentId);
    if (!productionComp) {
        console.warn(
            `[ProductionJob] Building ${job.targetBuilding} has no ProductionComponent`,
        );
        completeJob(worker, root);
        return;
    }

    const definition = getProductionDefinition(productionComp.productionId);
    if (!definition) {
        console.warn(
            `[ProductionJob] Unknown production definition: ${productionComp.productionId}`,
        );
        completeJob(worker, root);
        return;
    }

    // Check if worker is adjacent to building
    if (
        !isPointAdjacentTo(buildingEntity.worldPosition, worker.worldPosition)
    ) {
        const movement = doMovement(worker, buildingEntity.worldPosition);
        if (movement === MovementResult.Failure) {
            console.warn(
                `[ProductionJob] Worker failed to reach building ${job.targetBuilding}`,
            );
            completeJob(worker, root);
        }
        return;
    }

    // Increment progress
    job.progress += 1;
    worker.invalidateComponent(JobRunnerComponentId);

    // Check if production is complete
    if (job.progress >= definition.duration) {
        const yieldDef = definition.yield;

        if (yieldDef.type === "item") {
            // Add item to worker's inventory
            const workerInventory =
                worker.getEcsComponent(InventoryComponentId);
            if (workerInventory) {
                addInventoryItem(
                    workerInventory,
                    yieldDef.item,
                    yieldDef.amount,
                );
                worker.invalidateComponent(InventoryComponentId);
            }
        } else if (yieldDef.type === "entity") {
            // Spawn resource entity at random position in pattern
            const chunkMapComp = root.getEcsComponent(ChunkMapComponentId);
            if (chunkMapComp) {
                const spawnPosition = findRandomSpawnInDiamond(
                    buildingEntity.worldPosition,
                    FORRESTER_RADIUS,
                    chunkMapComp.chunkMap,
                );

                if (spawnPosition) {
                    const resource = getResourceById(yieldDef.resourceId);
                    if (resource) {
                        const entity = resourcePrefab(resource);
                        entity.worldPosition = spawnPosition;
                        root.addChild(entity);
                    } else {
                        console.warn(
                            `[ProductionJob] Unknown resource: ${yieldDef.resourceId}`,
                        );
                    }
                } else {
                    console.log(
                        `[ProductionJob] No valid spawn position for tree near ${buildingEntity.id}`,
                    );
                }
            }
        }

        completeJob(worker, root);
    }
};
