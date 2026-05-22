import { distance } from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import {
    InventoryComponentId,
    getInventoryItem,
} from "../../component/inventoryComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { CollectableComponentId } from "../../component/collectableComponent.ts";
import { GroundItemComponentId } from "../../component/groundItemComponent.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { CraftingJob } from "../craftingJob.ts";
import { failJobFromQueue } from "../jobLifecycle.ts";
import { findStockpilesWithItem } from "../../building/materialQuery.ts";
import { findDropPosition } from "../../behavior/dropItem.ts";

/**
 * Plan actions for crafting an item under the held-item model.
 *
 * Inputs are staged inside the building's inventory rather than the
 * worker's; the worker shuttles inputs in piecemeal (held is single
 * item id). When all inputs are present in the building the worker
 * walks over and runs the craft action, which consumes from the
 * building and outputs to held.
 *
 * Returns the next single trip's worth of actions.
 */
export function planCrafting(
    root: Entity,
    worker: Entity,
    job: CraftingJob,
): BehaviorActionData[] {
    const buildingEntity = root.findEntity(job.targetBuilding);
    if (!buildingEntity) {
        return failAndAbort(worker, job);
    }

    const buildingInventory =
        buildingEntity.getEcsComponent(InventoryComponentId);
    if (!buildingInventory) {
        return failAndAbort(worker, job);
    }

    const held = worker.requireEcsComponent(HeldItemComponentId);

    const buildingHasAllInputs = job.recipe.inputs.every((input) => {
        const stack = getInventoryItem(buildingInventory, input.item.id);
        return stack && stack.amount >= input.amount;
    });

    if (buildingHasAllInputs) {
        // Before crafting we must guarantee held can accept the output —
        // either empty or already holding the same item id.
        const dropActions = ensureHeldAcceptsOutputs(root, worker, job, held);
        return [
            ...dropActions,
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

    // Pick the first input the building still needs.
    const stillNeeded = job.recipe.inputs
        .map((input) => {
            const stack = getInventoryItem(buildingInventory, input.item.id);
            const have = stack?.amount ?? 0;
            return {
                itemId: input.item.id,
                item: input.item,
                deficit: input.amount - have,
            };
        })
        .filter((entry) => entry.deficit > 0);

    if (stillNeeded.length === 0) {
        // Building has everything — caller will retry and hit the craft branch.
        return [];
    }

    // If held already carries something useful, deposit it first.
    if (!isHeldEmpty(held)) {
        const matching = stillNeeded.find(
            (entry) => entry.itemId === held.item!.id,
        );
        if (matching) {
            return [
                {
                    type: "moveTo",
                    target: buildingEntity.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "depositToInventory",
                    targetEntityId: job.targetBuilding,
                    itemId: held.item!.id,
                },
            ];
        }
        // Held has something the building doesn't need — drop it before fetching.
        const dropPos = findDropPosition(
            root,
            worker.worldPosition,
            held.item!,
        );
        if (!dropPos) {
            throw new Error(
                `craftingPlanner: cannot find drop position for held item ` +
                    `'${held.item!.id}' within radius`,
            );
        }
        return [
            { type: "moveTo", target: dropPos },
            { type: "dropHeld", destination: dropPos },
        ];
    }

    // Held empty — find a source for the first needed input, prefer stockpiles
    // then ground piles.
    for (const need of stillNeeded) {
        const stockpileSources = findStockpilesWithItem(
            root,
            need.itemId,
            worker.worldPosition,
        );
        if (stockpileSources.length > 0) {
            const nearest = stockpileSources[0];
            const fetchAmount = Math.min(nearest.availableAmount, need.deficit);
            return [
                {
                    type: "moveTo",
                    target: nearest.position,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "withdrawFromStockpile",
                    stockpileId: nearest.entity.id,
                    itemId: need.itemId,
                    amount: fetchAmount,
                },
                {
                    type: "moveTo",
                    target: buildingEntity.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "depositToInventory",
                    targetEntityId: job.targetBuilding,
                    itemId: need.itemId,
                },
            ];
        }

        const pile = findNearestGroundPileWithItem(
            root,
            worker.worldPosition,
            need.itemId,
        );
        if (pile) {
            return [
                {
                    type: "moveTo",
                    target: pile.worldPosition,
                    stopAdjacent: "cardinal",
                },
                { type: "pickupFromGround", pileEntityId: pile.id },
                {
                    type: "moveTo",
                    target: buildingEntity.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "depositToInventory",
                    targetEntityId: job.targetBuilding,
                    itemId: need.itemId,
                },
            ];
        }
    }

    // No source available for any needed input — suspend by failing.
    return failAndAbort(worker, job);
}

function failAndAbort(worker: Entity, job: CraftingJob): BehaviorActionData[] {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        failJobFromQueue(queueEntity, job);
    }
    return [];
}

function ensureHeldAcceptsOutputs(
    root: Entity,
    worker: Entity,
    job: CraftingJob,
    held: import("../../component/heldItemComponent.ts").HeldItemComponent,
): BehaviorActionData[] {
    if (isHeldEmpty(held)) return [];
    const allOutputsMatch = job.recipe.outputs.every(
        (out) => out.item.id === held.item!.id,
    );
    if (allOutputsMatch) return [];

    const dropPos = findDropPosition(root, worker.worldPosition, held.item!);
    if (!dropPos) {
        throw new Error(
            `craftingPlanner: cannot find drop position for held item ` +
                `'${held.item!.id}' within radius`,
        );
    }
    return [
        { type: "moveTo", target: dropPos },
        { type: "dropHeld", destination: dropPos },
    ];
}

function findNearestGroundPileWithItem(
    root: Entity,
    from: import("../../../common/point.ts").Point,
    itemId: string,
): Entity | null {
    const candidates = root.queryComponents(GroundItemComponentId);
    let best: Entity | null = null;
    let bestDistance = Infinity;
    for (const [entity] of candidates) {
        const collectable = entity.getEcsComponent(CollectableComponentId);
        if (!collectable) continue;
        const matches = collectable.items.some(
            (stack) => stack.item.id === itemId && stack.amount > 0,
        );
        if (!matches) continue;
        const d = distance(from, entity.worldPosition);
        if (d < bestDistance) {
            bestDistance = d;
            best = entity;
        }
    }
    return best;
}
