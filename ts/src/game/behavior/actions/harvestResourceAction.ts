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
import { JobQueueComponentId } from "../../component/jobQueueComponent.ts";
import {
    findJobClaimedBy,
    completeJobFromQueue,
} from "../../job/jobLifecycle.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
} from "./Action.ts";

export type HarvestResourceActionData = {
    type: "harvestResource";
    entityId: string;
    harvestAction: ResourceHarvestMode;
    workProgress?: number;
};
import type { NaturalResource } from "../../../data/inventory/items/naturalResource.ts";

/**
 * Harvest a resource entity and deposit yields into the worker's held
 * slot. Held is single-item-id, so a resource that yields a different
 * item id than what's already held will fail when the harvest completes.
 * Callers should ensure held is empty or matches the yield before
 * starting a harvest.
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

function depositYields(
    worker: Entity,
    resource: NaturalResource,
    held: HeldItemComponent,
): ActionResult | null {
    if (!isHeldEmpty(held)) {
        const heldId = held.item!.id;
        const allMatch = resource.yields.every(
            (y) => y.item.id === heldId,
        );
        if (!allMatch) {
            log.warn(
                `Cannot deposit harvest yields: held has ${heldId}, yields are ${resource.yields.map((y) => y.item.id).join(",")}`,
            );
            return { kind: "failed", cause: { type: "unknown" } };
        }
    } else {
        const firstYieldId = resource.yields[0]?.item.id;
        if (firstYieldId) {
            const allMatch = resource.yields.every(
                (y) => y.item.id === firstYieldId,
            );
            if (!allMatch) {
                log.warn(
                    `Resource ${resource.id} has multiple yield item ids; cannot fit in held slot`,
                );
                return { kind: "failed", cause: { type: "unknown" } };
            }
        }
    }
    for (const yieldItem of resource.yields) {
        addToHeldItem(
            held,
            structuredClone(yieldItem.item),
            yieldItem.amount,
        );
    }
    worker.invalidateComponent(HeldItemComponentId);
    return null;
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
        const failure = depositYields(worker, resource, held);
        if (failure) return failure;

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
        const failure = depositYields(worker, resource, held);
        if (failure) return failure;

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
