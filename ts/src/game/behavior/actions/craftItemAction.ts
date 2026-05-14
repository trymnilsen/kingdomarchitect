import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    InventoryComponentId,
    takeInventoryItem,
} from "../../component/inventoryComponent.ts";
import {
    addToHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
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
 * On the first tick, inputs are taken from the building's input buffer
 * and inputsConsumed is set to true. Subsequent ticks track progress
 * toward completion without touching inventories. If the entity replans
 * before completion, the consumed inputs are lost — intentional, as
 * partial crafting is treated as a failed attempt.
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
 * - First tick: consume inputs from the building's inventory.
 * - Progress stored on action.progress.
 * - On completion: deposit outputs into the worker's held slot.
 *
 * The planner is responsible for ensuring held is either empty or holds
 * the same item id as the recipe's output before this action runs; if
 * held holds an incompatible item the action fails.
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

    const buildingInventory = buildingEntity.requireEcsComponent(
        InventoryComponentId,
    );
    const held = entity.requireEcsComponent(HeldItemComponentId);

    const recipe = action.recipe;

    if (!action.inputsConsumed) {
        for (const input of recipe.inputs) {
            const stack = buildingInventory.items.find(
                (s) => s.item.id === input.item.id,
            );
            if (!stack || stack.amount < input.amount) {
                log.warn(
                    `Building ${action.buildingId} missing materials: needs ${input.amount}x ${input.item.id}, has ${stack?.amount ?? 0}`,
                );
                return { kind: "failed", cause: { type: "noResources" } };
            }
        }

        for (const input of recipe.inputs) {
            const taken = takeInventoryItem(
                buildingInventory,
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

        buildingEntity.invalidateComponent(InventoryComponentId);
        action.inputsConsumed = true;
    }

    if (action.progress === undefined) {
        action.progress = 0;
    }
    action.progress++;
    spendEntityEnergy(entity, 2);

    if (action.progress >= recipe.duration) {
        for (const output of recipe.outputs) {
            if (
                !isHeldEmpty(held) &&
                held.item!.id !== output.item.id
            ) {
                log.warn(
                    `Cannot deposit craft output: held has ${held.item!.id}, output is ${output.item.id}`,
                );
                return { kind: "failed", cause: { type: "unknown" } };
            }
            addToHeldItem(held, output.item, output.amount);
        }
        entity.invalidateComponent(HeldItemComponentId);

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
