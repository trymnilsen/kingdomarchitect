import { isPointAdjacentTo, type Point } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import {
    getResourceById,
    ResourceHarvestMode,
} from "../../../data/inventory/items/naturalResource.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";

import { damage, HealthComponentId } from "../../component/healthComponent.ts";
import {
    addToHeldItem,
    HeldItemComponentId,
    isHeldEmpty,
    type HeldItemComponent,
} from "../../component/heldItemComponent.ts";
import { OutputPolicy } from "../../component/outputPolicyComponent.ts";
import { RegrowComponentId } from "../../component/regrowComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { findAcceptingStockpile } from "../../entity/findAcceptingStockpile.ts";
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import {
    findJobClaimedBy,
    removeJobFromQueue,
} from "../../job/jobLifecycle.ts";
import { scatterYields } from "../scatterYields.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";

export type HarvestResourceActionData = {
    type: "harvestResource";
    entityId: string;
    harvestAction: ResourceHarvestMode;
    /**
     * Where the yields go. Absent means Haul, which is what a worker sent out
     * to collect something wants: it comes back carrying it.
     */
    outputPolicy?: OutputPolicy;
    workProgress?: number;
};
import type { NaturalResource } from "../../../data/inventory/items/naturalResource.ts";

/**
 * Harvest a resource entity.
 *
 * Under the Haul policy the yields go into the worker's held slot. Held is
 * single-item-id, so a resource that yields a different item id than what's
 * already held cannot be collected directly. Rather than fail, the worker frees
 * its hand first (see {@link freeHandSubaction}) and then resumes the harvest
 * into an empty slot.
 *
 * Under Drop the yields are left on the ground where the resource stood and the
 * hand is never involved, so a worker producing at a building keeps working
 * instead of walking each load to a store.
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
    const policy = action.outputPolicy ?? OutputPolicy.Haul;

    // Precondition for hauling: the held slot must be empty or already hold the
    // yield item. If it holds something else, free the hand before harvesting
    // rather than failing. Otherwise the worker can never collect this
    // resource. Dropping never touches the hand, so it has no such precondition.
    if (policy === OutputPolicy.Haul && heldBlocksYield(held, resource)) {
        return freeHandSubaction(entity, resourceEntity, held);
    }

    if (action.harvestAction === ResourceHarvestMode.Chop) {
        return executeChopHarvest(
            entity,
            resourceEntity,
            resource,
            held,
            policy,
            tick,
        );
    } else {
        return executeWorkHarvest(
            entity,
            resourceEntity,
            resource,
            held,
            policy,
            action,
            tick,
        );
    }
}

/**
 * Hand the yields to the worker or to the ground, depending on the policy the
 * order was planned under. Dropping happens after the resource is gone so the
 * tile it stood on can take the pile.
 */
function collectYields(
    worker: Entity,
    resource: NaturalResource,
    held: HeldItemComponent,
    policy: OutputPolicy,
    position: Point,
    tick: number,
): void {
    if (policy === OutputPolicy.Drop) {
        scatterYields(
            worker.getRootEntity(),
            tick,
            resource,
            position,
            `Set out from harvesting ${resource.name}`,
        );
        return;
    }
    depositYields(worker, resource, held);
}

/**
 * True when the held slot holds an item that does not match the resource's
 * yield, so collecting would require mixing two item ids in one slot.
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

    const resourceName =
        getResourceById(
            resourceEntity.getEcsComponent(ResourceComponentId)?.resourceId ??
                "",
        )?.name ?? "a resource";
    return {
        kind: "subaction",
        actions: [
            {
                type: "dropHeld",
                reason: `Dropped ${held.item!.name} to free hands for harvesting ${resourceName}`,
            },
        ],
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
    policy: OutputPolicy,
    tick: number,
): ActionResult {
    const healthComponent =
        resourceEntity.requireEcsComponent(HealthComponentId);

    damage(healthComponent, 10);
    resourceEntity.invalidateComponent(HealthComponentId);
    spendEntityEnergy(worker, 2);

    if (healthComponent.currentHp <= 0) {
        const position = resourceEntity.worldPosition;
        resourceEntity.remove();
        collectYields(worker, resource, held, policy, position, tick);

        completeHarvestOrder(worker);
        return ActionComplete;
    }

    return ActionRunning;
}

function executeWorkHarvest(
    worker: Entity,
    resourceEntity: Entity,
    resource: NaturalResource,
    held: HeldItemComponent,
    policy: OutputPolicy,
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
        const position = resourceEntity.worldPosition;
        applyResourceLifecycle(resourceEntity, resource, tick);
        collectYields(worker, resource, held, policy, position, tick);

        completeHarvestOrder(worker);
        return ActionComplete;
    }

    return ActionRunning;
}

/**
 * Retire the order that sent the worker here. A harvest can also happen under
 * a production job (the forrester chopping its own zone), so both job kinds
 * end here. Any other claimed job the worker holds is left alone, since this
 * harvest was not what it asked for.
 */
function completeHarvestOrder(worker: Entity): void {
    const queueEntity = worker.getAncestorEntity(JobQueueComponentId);
    if (!queueEntity) {
        return;
    }
    const job = findJobClaimedBy(queueEntity, worker.id);
    if (job && (job.id === "collectResource" || job.id === "productionJob")) {
        removeJobFromQueue(queueEntity, job);
    }
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
