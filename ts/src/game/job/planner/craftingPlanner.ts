import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
import {
    InventoryComponentId,
    getInventoryItem,
} from "../../component/inventoryComponent.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { CraftingJob } from "../craftingJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";

/**
 * Plan actions for crafting an item.
 *
 * Evaluates the current state and returns actions up to the next decision point:
 * - Worker has all inputs: [moveTo(building), craftItem(recipe)]
 * - Worker needs inputs from building: [moveTo(building), takeFromInventory(inputs), craftItem(recipe)]
 */
export function planCrafting(
    root: Entity,
    worker: Entity,
    job: CraftingJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.targetBuilding);

    if (!buildingEntity) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    const workerInventory = worker.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    const workerHasAllInputs = job.recipe.inputs.every((input) => {
        const item = getInventoryItem(workerInventory, input.item.id);
        return item && item.amount >= input.amount;
    });

    if (workerHasAllInputs) {
        return [
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            {
                type: "craftItem",
                buildingId: job.targetBuilding,
                recipe: job.recipe,
            },
        ];
    }

    const buildingInventory =
        buildingEntity.getEcsComponent(InventoryComponentId);
    if (!buildingInventory) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    const itemsToTake: Array<{ itemId: string; amount: number }> = [];
    for (const input of job.recipe.inputs) {
        const workerItem = getInventoryItem(workerInventory, input.item.id);
        const workerAmount = workerItem?.amount ?? 0;
        const needed = input.amount - workerAmount;

        if (needed > 0) {
            const buildingItem = getInventoryItem(
                buildingInventory,
                input.item.id,
            );
            const available = buildingItem?.amount ?? 0;

            if (available < needed) {
                // Building can't cover the full shortfall. Fail the job rather
                // than taking partial inputs — partial inputs would be lost when
                // craftItem subsequently fails with noResources.
                const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
                if (queueEntity) {
                    failJobFromQueue(queueEntity, job);
                }
                return [];
            }

            itemsToTake.push({ itemId: input.item.id, amount: needed });
        }
    }

    if (itemsToTake.length === 0) {
        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            failJobFromQueue(queueEntity, job);
        }
        return [];
    }

    return [
        {
            type: "moveTo",
            target: buildingEntity.worldPosition,
            stopAdjacent: "cardinal",
        },
        {
            type: "takeFromInventory",
            sourceEntityId: job.targetBuilding,
            items: itemsToTake,
        },
        {
            type: "craftItem",
            buildingId: job.targetBuilding,
            recipe: job.recipe,
        },
    ];
}
