import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { findJobClaimedBy, completeJobFromQueue } from "../../job/jobLifecycle.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Craft an item at a building.
 * - First tick: Consume inputs from worker inventory
 * - Progress stored on action.progress
 * - On completion: Add outputs to building inventory
 * Assumes worker is already adjacent to building (moveTo should have run first).
 */
export function executeCraftItemAction(
    action: Extract<BehaviorActionData, { type: "craftItem" }>,
    entity: Entity,
): ActionStatus {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.buildingId);

    if (!buildingEntity) {
        console.warn(
            `[CraftItem] Building ${action.buildingId} not found`,
        );
        return "failed";
    }

    if (!isPointAdjacentTo(buildingEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[CraftItem] Worker not adjacent to building`);
        return "failed";
    }

    const workerInventory = entity.getEcsComponent(InventoryComponentId);
    if (!workerInventory) {
        console.warn(`[CraftItem] Worker has no inventory`);
        return "failed";
    }

    const buildingInventory = buildingEntity.getEcsComponent(InventoryComponentId);
    if (!buildingInventory) {
        console.warn(`[CraftItem] Building has no inventory`);
        return "failed";
    }

    const recipe = action.recipe;

    if (!action.inputsConsumed) {
        for (const input of recipe.inputs) {
            const item = workerInventory.items.find(
                (stack) => stack.item.id === input.item.id,
            );
            if (!item || item.amount < input.amount) {
                console.warn(
                    `[CraftItem] Worker missing materials: needs ${input.amount}x ${input.item.id}, has ${item?.amount ?? 0}`,
                );
                return "failed";
            }
        }

        for (const input of recipe.inputs) {
            const taken = takeInventoryItem(
                workerInventory,
                input.item.id,
                input.amount,
            );
            if (!taken) {
                console.warn(
                    `[CraftItem] Failed to consume ${input.amount}x ${input.item.id}`,
                );
                return "failed";
            }
        }

        entity.invalidateComponent(InventoryComponentId);
        action.inputsConsumed = true;
    }

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;

    if (action.progress >= recipe.duration) {
        for (const output of recipe.outputs) {
            addInventoryItem(buildingInventory, output.item, output.amount);
        }
        buildingEntity.invalidateComponent(InventoryComponentId);

        const job = findJobClaimedBy(root, entity.id);
        if (job) {
            completeJobFromQueue(root, job);
        }
        return "complete";
    }

    return "running";
}
