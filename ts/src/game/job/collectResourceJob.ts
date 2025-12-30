import { checkAdjacency } from "../../common/point.ts";
import { ResourceComponentId } from "../component/resourceComponent.ts";
import {
    createRegrowComponent,
    RegrowComponentId,
} from "../component/regrowComponent.ts";
import { damage, HealthComponentId } from "../component/healthComponent.ts";
import type { Entity } from "../entity/entity.ts";
import { completeJob, type Job, type JobHandler } from "./job.ts";
import { doMovement, MovementResult } from "./movementHelper.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../component/inventoryComponent.ts";
import {
    getResourceById,
    ResourceHarvestMode,
} from "../../data/inventory/items/naturalResource.ts";

export interface CollectResourceJob extends Job {
    id: typeof CollectResourceJobId;
    entityId: string;
    harvestAction: ResourceHarvestMode;
    workProgress?: number;
}

export function CollectResourceJob(
    entity: Entity,
    harvestAction: ResourceHarvestMode,
): CollectResourceJob {
    return {
        id: CollectResourceJobId,
        entityId: entity.id,
        harvestAction,
        workProgress: 0,
    };
}

export const CollectResourceJobId = "chopTreeJob";

export const collectResourceHandler: JobHandler<CollectResourceJob> = (
    _scene,
    root,
    runner,
    job,
    tick,
) => {
    const resourceEntity = root.findEntity(job.entityId);

    if (!resourceEntity) {
        console.error(`Unable to find resource entity with id ${job.entityId}`);
        completeJob(runner);
        return;
    }

    const resourceComponent =
        resourceEntity.getEcsComponent(ResourceComponentId);
    if (!resourceComponent) {
        console.error(`No resource component on entity ${job.entityId}`);
        completeJob(runner);
        return;
    }

    // Lookup resource definition by ID
    const resource = getResourceById(resourceComponent.resourceId);
    if (!resource) {
        console.error(
            `No resource definition found for ${resourceComponent.resourceId}`,
        );
        completeJob(runner);
        return;
    }

    // Check if we're adjacent to the resource
    if (
        checkAdjacency(resourceEntity.worldPosition, runner.worldPosition) ===
        null
    ) {
        // Not adjacent, move towards the resource
        const movement = doMovement(runner, resourceEntity.worldPosition);
        if (movement == MovementResult.Failure) {
            console.log("Failed to move to resource");
            completeJob(runner);
        }
    } else {
        // Adjacent to the resource, perform harvest action
        const workDuration = resource.workDuration ?? 1;

        // Initialize work progress if not set
        if (job.workProgress === undefined) {
            job.workProgress = 0;
        }

        // Increment work progress
        job.workProgress++;

        // Special handling for Chop action - uses HealthComponent
        if (job.harvestAction === ResourceHarvestMode.Chop) {
            const healthComponent =
                resourceEntity.getEcsComponent(HealthComponentId);
            if (!healthComponent) {
                console.log("Resource had no health component for chopping");
                completeJob(runner);
                return;
            }

            // Deal damage to the resource
            damage(healthComponent, 10);
            resourceEntity.invalidateComponent(HealthComponentId);

            // If resource is destroyed, complete the job
            if (healthComponent.currentHp <= 0) {
                completeJob(runner);
                resourceEntity.remove();
                // Chop yields are handled by health/tree-specific logic
                // For now, keeping existing wood reward for trees
                runner.updateComponent(InventoryComponentId, (inventory) => {
                    // Grant yields if defined
                    for (const yieldItem of resource.yields) {
                        addInventoryItem(
                            inventory,
                            yieldItem.item,
                            yieldItem.amount,
                        );
                    }
                });
            }
        } else {
            // For other harvest actions (Mine, Cut, Pick), check work progress
            if (job.workProgress >= workDuration) {
                // Work complete - grant items and apply lifecycle
                runner.updateComponent(InventoryComponentId, (inventory) => {
                    // Grant yields
                    for (const yieldItem of resource.yields) {
                        addInventoryItem(
                            inventory,
                            yieldItem.item,
                            yieldItem.amount,
                        );
                    }
                });

                // Apply lifecycle behavior
                const lifecycle = resource.lifecycle;
                if (lifecycle.type === "Finite") {
                    // Finite resources are removed permanently
                    resourceEntity.remove();
                    completeJob(runner);
                } else if (lifecycle.type === "Infinite") {
                    // Infinite nodes remain, just reset work progress for next batch
                    job.workProgress = 0;
                    completeJob(runner);
                } else if (lifecycle.type === "Remove") {
                    // Remove the entity permanently
                    resourceEntity.remove();
                    completeJob(runner);
                } else if (lifecycle.type === "Regrow") {
                    // Mark as harvested - regrow system will handle restoration
                    const regrowComponent =
                        resourceEntity.getEcsComponent(RegrowComponentId);
                    if (regrowComponent) {
                        regrowComponent.harvestedAtTick = tick;
                        resourceEntity.invalidateComponent(RegrowComponentId);
                    }
                    completeJob(runner);
                }
            }
        }
    }
};
