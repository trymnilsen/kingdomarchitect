import { isPointAdjacentTo } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";
import {
    getResourceById,
    ResourceHarvestMode,
} from "../../../data/inventory/items/naturalResource.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";

const log = createLogger("behavior");
import { damage, HealthComponentId } from "../../component/healthComponent.ts";
import {
    addToHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
    type HeldItemComponent,
} from "../../component/heldItemComponent.ts";
import { RegrowComponentId } from "../../component/regrowComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import {
    findJobClaimedBy,
    completeJobFromQueue,
} from "../../job/jobLifecycle.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./Action.ts";

export type HarvestResourceActionData = {
    type: "harvestResource";
    entityId: string;
    harvestAction: ResourceHarvestMode;
    workProgress?: number;
};
import type { NaturalResource } from "../../../data/inventory/items/naturalResource.ts";

/**
 * Harvest a resource entity and deposit yields into the worker's held slot.
 * Held is single-item-id, so a resource that yields a different item id than
 * what's already held cannot be collected directly. Rather than fail, the
 * worker frees its hand first (see {@link freeHandSubaction}) and then resumes
 * the harvest into an empty slot.
 */
export function executeHarvestResourceAction(
    action: HarvestResourceActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const root = entity.getRootEntity();
    const resourceEntity = root.findEntity(action.entityId);

    if (!resourceEntity) {
        log.warn(`Resource entity ${action.entityId} not found`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.entityId },
        };
    }

    if (
        !isPointAdjacentTo(resourceEntity.worldPosition, entity.worldPosition)
    ) {
        log.warn(`Worker not adjacent to resource`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const resourceComponent =
        resourceEntity.getEcsComponent(ResourceComponentId);
    if (!resourceComponent) {
        log.warn(`Entity ${action.entityId} has no ResourceComponent`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const resource = getResourceById(resourceComponent.resourceId);
    if (!resource) {
        log.warn(`Unknown resource: ${resourceComponent.resourceId}`);
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const held = entity.requireEcsComponent(HeldItemComponentId);

    // Precondition: the held slot must be empty or already hold the yield item.
    // If it holds something else, free the hand before harvesting rather than
    // failing — otherwise the worker can never collect this resource.
    if (heldBlocksYield(held, resource)) {
        return freeHandSubaction(entity, resourceEntity, held);
    }

    if (action.harvestAction === ResourceHarvestMode.Chop) {
        return executeChopHarvest(entity, resourceEntity, resource, held);
    } else {
        return executeWorkHarvest(
            entity,
            resourceEntity,
            resource,
            held,
            action,
            tick,
        );
    }
}

/**
 * True when the held slot holds an item that does not match the resource's
 * yield — i.e. collecting would require mixing two item ids in one slot.
 */
function heldBlocksYield(
    held: HeldItemComponent,
    resource: NaturalResource,
): boolean {
    if (isHeldEmpty(held)) return false;
    const heldId = held.item!.id;
    return resource.yields.some((y) => y.item.id !== heldId);
}

/**
 * Emit a subaction chain that empties the worker's hand so the suspended
 * harvest can resume. Prefers depositing into an accepting stockpile (walking
 * there and back), and falls back to dropping the held item where the worker
 * stands when no stockpile will take it.
 */
function freeHandSubaction(
    worker: Entity,
    resourceEntity: Entity,
    held: HeldItemComponent,
): ActionResult {
    const stockpile = findAcceptingStockpile(worker, held.item!.id);
    if (stockpile) {
        return {
            kind: "subaction",
            actions: [
                {
                    type: "moveTo",
                    target: stockpile.worldPosition,
                    stopAdjacent: "cardinal",
                },
                {
                    type: "depositToStockpile",
                    stockpileId: stockpile.id,
                },
                {
                    type: "moveTo",
                    target: resourceEntity.worldPosition,
                    stopAdjacent: "cardinal",
                },
            ],
        };
    }

    return {
        kind: "subaction",
        actions: [{ type: "dropHeld" }],
    };
}

/**
 * Deposit the resource's yields into the worker's held slot. The caller
 * guarantees held is empty or already holds the yield item (see
 * {@link heldBlocksYield}), so the only remaining guard is the data-level case
 * of a resource defining multiple distinct yield item ids, which cannot share
 * one held slot.
 */
function depositYields(
    worker: Entity,
    resource: NaturalResource,
    held: HeldItemComponent,
): void {
    const firstYieldId = resource.yields[0]?.item.id;
    const uniform = resource.yields.every((y) => y.item.id === firstYieldId);
    if (!uniform) {
        log.warn(
            `Resource ${resource.id} has multiple yield item ids; cannot fit in held slot`,
        );
        return;
    }

    for (const yieldItem of resource.yields) {
        addToHeldItem(held, structuredClone(yieldItem.item), yieldItem.amount);
    }
    worker.invalidateComponent(HeldItemComponentId);
}

function executeChopHarvest(
    worker: Entity,
    resourceEntity: Entity,
    resource: NaturalResource,
    held: HeldItemComponent,
): ActionResult {
    const healthComponent =
        resourceEntity.requireEcsComponent(HealthComponentId);

    damage(healthComponent, 10);
    resourceEntity.invalidateComponent(HealthComponentId);
    spendEntityEnergy(worker, 2);

    if (healthComponent.currentHp <= 0) {
        depositYields(worker, resource, held);
        resourceEntity.remove();

        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            const job = findJobClaimedBy(queueEntity, worker.id);
            if (job && job.id === "collectResource") {
                completeJobFromQueue(queueEntity, job);
            }
        }
        return ActionComplete;
    }

    return ActionRunning;
}

function executeWorkHarvest(
    worker: Entity,
    resourceEntity: Entity,
    resource: NaturalResource,
    held: HeldItemComponent,
    action: HarvestResourceActionData,
    tick: number,
): ActionResult {
    const workDuration = resource.workDuration ?? 1;

    if (action.workProgress === undefined) {
        action.workProgress = 0;
    }
    action.workProgress++;
    spendEntityEnergy(worker, 2);

    if (action.workProgress >= workDuration) {
        depositYields(worker, resource, held);

        applyResourceLifecycle(resourceEntity, resource, tick);

        const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
        if (queueEntity) {
            const job = findJobClaimedBy(queueEntity, worker.id);
            if (job && job.id === "collectResource") {
                completeJobFromQueue(queueEntity, job);
            }
        }
        return ActionComplete;
    }

    return ActionRunning;
}

function applyResourceLifecycle(
    resourceEntity: Entity,
    resource: NaturalResource,
    tick: number,
): void {
    const lifecycle = resource.lifecycle;
    if (lifecycle.type === "Finite" || lifecycle.type === "Remove") {
        resourceEntity.remove();
    } else if (lifecycle.type === "Regrow") {
        const regrowComponent =
            resourceEntity.getEcsComponent(RegrowComponentId);
        if (regrowComponent) {
            regrowComponent.harvestedAtTick = tick;
            resourceEntity.invalidateComponent(RegrowComponentId);
        }
    }
}
