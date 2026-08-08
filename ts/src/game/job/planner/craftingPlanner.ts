import type { Entity } from "../../entity/entity.ts";
import { findNearestGroundPileWithItem } from "../../entity/findNearestGroundPileWithItem.ts";
import type { BehaviorActionData } from "../../behavior/actions/ActionData.ts";
import {
    InventoryComponentId,
    getInventoryItem,
} from "../../component/inventoryComponent.ts";
import {
    HeldItemComponentId,
    type HeldItemComponent,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import type { CraftingJob } from "../craftingJob.ts";
import { failJobFromQueue, suspendJobInQueue } from "../jobLifecycle.ts";
import { findStockpilesWithItem } from "../../building/materialQuery.ts";
import { findDropPosition } from "../../behavior/dropItem.ts";

/**
 * Release the worker's claim while leaving the job in the queue, so it can be
 * retried once its inputs become available (mirrors the build planner). Used
 * for temporary blockers like "no source for an input yet" or "can't free
 * hands to fetch ingredients". Permanently broken jobs (missing
 * building/inventory) call {@link failAndAbort} instead.
 */
function suspendJob(worker: Entity, job: CraftingJob): void {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        suspendJobInQueue(queueEntity, job);
    }
}

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
        // Before crafting we must guarantee held can accept the output. It has
        // to be empty or already holding the same item id.
        const dropActions = ensureHeldAcceptsOutputs(root, worker, job, held);
        if (dropActions === null) {
            // Holding an item that blocks the output and nowhere to drop it.
            // Suspend rather than throw out of the unguarded expand() path.
            suspendJob(worker, job);
            return [];
        }
        return [
            ...dropActions,
            {
                type: "moveTo",
                target: buildingEntity.worldPosition,
                stopAdjacent: "cardinal",
            },
            { type: "stepOnto", targetId: job.targetBuilding },
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
        // Building has everything. The caller retries and hits the craft branch.
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
        // Held has something the building doesn't need, so drop it before fetching.
        const dropPos = findDropPosition(
            root,
            worker.worldPosition,
            held.item!,
        );
        if (!dropPos) {
            // No free tile to drop the held item (e.g. worker boxed in). Suspend
            // rather than throw: a throw here propagates out of the unguarded
            // expand()/selectBehavior path and aborts the whole behavior tick.
            suspendJob(worker, job);
            return [];
        }
        return [
            { type: "moveTo", target: dropPos },
            {
                type: "dropHeld",
                destination: dropPos,
                reason: `Dropped ${held.item!.name} to fetch ingredients for crafting ${job.recipe.name}`,
            },
        ];
    }

    // Held is empty. Find a source for the first needed input, preferring
    // stockpiles then ground piles.
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

    // No source available for any needed input yet. Suspend (keep the job in
    // the queue, release the claim) so it retries once materials arrive,
    // matching the build planner. Failing here would silently delete a
    // player-queued craft the moment its inputs are momentarily unavailable.
    suspendJob(worker, job);
    return [];
}

function failAndAbort(worker: Entity, job: CraftingJob): BehaviorActionData[] {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (queueEntity) {
        failJobFromQueue(queueEntity, job);
    }
    return [];
}

/**
 * Returns the actions needed to free the worker's hands so held can accept the
 * craft outputs (empty, or already the same item). Returns an empty array when
 * no drop is needed, or `null` when a drop is required but no drop position
 * exists. The caller suspends the job in that case.
 */
function ensureHeldAcceptsOutputs(
    root: Entity,
    worker: Entity,
    job: CraftingJob,
    held: HeldItemComponent,
): BehaviorActionData[] | null {
    if (isHeldEmpty(held)) return [];
    const allOutputsMatch = job.recipe.outputs.every(
        (out) => out.item.id === held.item!.id,
    );
    if (allOutputsMatch) return [];

    const dropPos = findDropPosition(root, worker.worldPosition, held.item!);
    if (!dropPos) {
        return null;
    }
    return [
        { type: "moveTo", target: dropPos },
        {
            type: "dropHeld",
            destination: dropPos,
            reason: `Dropped ${held.item!.name} to free hands for ${job.recipe.name} output`,
        },
    ];
}
