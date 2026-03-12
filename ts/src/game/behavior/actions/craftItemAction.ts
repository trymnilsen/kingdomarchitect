import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";

const log = createLogger("behavior");
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    findJobClaimedBy,
    completeJobFromQueue,
} from "../../job/jobLifecycle.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
} from "./Action.ts";
import type { CraftingRecipe } from "../../../data/crafting/craftingRecipe.ts";

/**
 * Two-phase to avoid consuming inputs and then losing them to a replan.
 * On the first tick, inputs are taken from the worker and inputsConsumed is set to true.
 * Subsequent ticks track progress toward completion without touching inventory again.
 * If the entity replans before completion, the consumed inputs are lost — intentional,
 * as partial crafting is treated as a failed attempt.
 */
export type CraftItemActionData = {
    type: "craftItem";
    buildingId: string;
    recipe: CraftingRecipe;
    progress?: number;
    inputsConsumed?: boolean;
};

/**
 * Craft an item at a building.
 * - First tick: Consume inputs from worker inventory
 * - Progress stored on action.progress
 * - On completion: Add outputs to worker inventory
 * Assumes worker is already adjacent to building (moveTo should have run first).
 */
export function executeCraftItemAction(
    action: CraftItemActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.buildingId);

    if (!buildingEntity) {
        log.warn(`Building ${action.buildingId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.buildingId },
        };
    }

    if (
        !isPointAdjacentTo(buildingEntity.worldPosition, entity.worldPosition)
    ) {
        log.warn(`Worker not adjacent to building`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const workerInventory = entity.requireEcsComponent(InventoryComponentId);
    // Building inventory kept as structural validator; future input staging may use it.
    buildingEntity.requireEcsComponent(InventoryComponentId);

    const recipe = action.recipe;

    // TODO: check inventory capacity before claiming craft jobs
    if (!action.inputsConsumed) {
        for (const input of recipe.inputs) {
            const item = workerInventory.items.find(
                (stack) => stack.item.id === input.item.id,
            );
            if (!item || item.amount < input.amount) {
                log.warn(
                    `Worker missing materials: needs ${input.amount}x ${input.item.id}, has ${item?.amount ?? 0}`,
                );
                return { kind: "failed", cause: { type: "noResources" } };
            }
        }

        for (const input of recipe.inputs) {
            const taken = takeInventoryItem(
                workerInventory,
                input.item.id,
                input.amount,
            );
            if (!taken) {
                log.warn(
                    `Failed to consume ${input.amount}x ${input.item.id}`,
                );
                return { kind: "failed", cause: { type: "noResources" } };
            }
        }

        entity.invalidateComponent(InventoryComponentId);
        action.inputsConsumed = true;
    }

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;
    spendEntityEnergy(entity, 2);

    if (action.progress >= recipe.duration) {
        for (const output of recipe.outputs) {
            addInventoryItem(workerInventory, output.item, output.amount);
        }
        entity.invalidateComponent(InventoryComponentId);

        const queueEntity = entity.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            const job = findJobClaimedBy(queueEntity, entity.id);
            if (job) {
                completeJobFromQueue(queueEntity, job);
            }
        }
        return ActionComplete;
    }

    return ActionRunning;
}
