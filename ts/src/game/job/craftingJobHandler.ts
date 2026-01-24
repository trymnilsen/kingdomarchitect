import { isPointAdjacentTo } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { InventoryComponentId, takeInventoryItem, addInventoryItem } from "../component/inventoryComponent.ts";
import { JobRunnerComponentId } from "../component/jobRunnerComponent.ts";
import { completeJob, type JobHandler } from "./job.ts";
import { doMovement, MovementResult } from "./movementHelper.ts";
import type { CraftingJob } from "./craftingJob.ts";

export const craftingJobHandler: JobHandler<CraftingJob> = (
    root,
    worker,
    job,
) => {
    const buildingEntity = root.findEntity(job.targetBuilding);

    if (!buildingEntity) {
        console.warn(`Unable to find building entity ${job.targetBuilding}`);
        completeJob(worker);
        return;
    }

    // Check if worker is adjacent to building
    if (!isPointAdjacentTo(buildingEntity.worldPosition, worker.worldPosition)) {
        // Movement phase: navigate to building
        const movement = doMovement(worker, buildingEntity.worldPosition);
        if (movement === MovementResult.Failure) {
            console.warn(`Worker failed to reach building ${job.targetBuilding}`);
            completeJob(worker);
        }
        return;
    }

    // Crafting phase: worker is adjacent to building
    const workerInventory = worker.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        console.warn(`Worker ${worker.id} has no inventory component`);
        completeJob(worker);
        return;
    }

    const buildingInventory = buildingEntity.getEcsComponent(InventoryComponentId);
    if (!buildingInventory) {
        console.warn(`Building ${buildingEntity.id} has no inventory component`);
        completeJob(worker);
        return;
    }

    // First tick: validate and consume materials
    if (job.progress === 0) {
        // Validate worker has all required materials
        for (const input of job.recipe.inputs) {
            const item = workerInventory.items.find(
                (stack) => stack.item.id === input.item.id
            );
            if (!item || item.amount < input.amount) {
                console.warn(
                    `Worker ${worker.id} missing materials for recipe ${job.recipe.id}: ` +
                    `needs ${input.amount}x ${input.item.id}, has ${item?.amount ?? 0}`
                );
                completeJob(worker);
                return;
            }
        }

        // Consume materials from worker's inventory
        for (const input of job.recipe.inputs) {
            const taken = takeInventoryItem(
                workerInventory,
                input.item.id,
                input.amount
            );
            if (!taken) {
                console.error(
                    `Failed to consume ${input.amount}x ${input.item.id} from worker ${worker.id}`
                );
                completeJob(worker);
                return;
            }
        }

        worker.invalidateComponent(InventoryComponentId);
    }

    // Increment progress
    job.progress += 1;
    worker.invalidateComponent(JobRunnerComponentId);

    // Check if crafting is complete
    if (job.progress >= job.recipe.duration) {
        // Add outputs to building's inventory
        for (const output of job.recipe.outputs) {
            addInventoryItem(
                buildingInventory,
                output.item,
                output.amount
            );
        }

        buildingEntity.invalidateComponent(InventoryComponentId);
        completeJob(worker);
    }
};
