import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/Action.ts";
import { InventoryComponentId, getInventoryItem } from "../../component/inventoryComponent.ts";
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
        failJobFromQueue(root, job);
        return [];
    }

    const workerInventory = worker.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        failJobFromQueue(root, job);
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

    const buildingInventory = buildingEntity.getEcsComponent(InventoryComponentId);
    if (!buildingInventory) {
        failJobFromQueue(root, job);
        return [];
    }

    const itemsToTake: Array<{ itemId: string; amount: number }> = [];
    for (const input of job.recipe.inputs) {
        const workerItem = getInventoryItem(workerInventory, input.item.id);
        const workerAmount = workerItem?.amount ?? 0;
        const needed = input.amount - workerAmount;

        if (needed > 0) {
            const buildingItem = getInventoryItem(buildingInventory, input.item.id);
            const available = buildingItem?.amount ?? 0;
            const toTake = Math.min(needed, available);

            if (toTake > 0) {
                itemsToTake.push({ itemId: input.item.id, amount: toTake });
            }
        }
    }

    if (itemsToTake.length === 0) {
        failJobFromQueue(root, job);
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
