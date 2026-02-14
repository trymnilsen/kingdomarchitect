import { isPointAdjacentTo } from "../../../common/point.ts";
import {
    getResourceById,
    ResourceHarvestMode,
} from "../../../data/inventory/items/naturalResource.ts";
import { damage, HealthComponentId } from "../../component/healthComponent.ts";
import {
    addInventoryItem,
    InventoryComponentId,
    type InventoryComponent,
} from "../../component/inventoryComponent.ts";
import { RegrowComponentId } from "../../component/regrowComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { findJobClaimedBy, completeJobFromQueue } from "../../job/jobLifecycle.ts";
import {
    ActionComplete,
    ActionFailed,
    ActionRunning,
    type ActionStatus,
    type BehaviorActionData,
} from "./Action.ts";
import type { NaturalResource } from "../../../data/inventory/items/naturalResource.ts";

/**
 * Harvest a resource entity.
 * - Chop mode: Progress derived from target's HealthComponent
 * - Other modes: Progress stored on action.workProgress
 * Assumes worker is already adjacent to resource (moveTo should have run first).
 */
export function executeHarvestResourceAction(
    action: Extract<BehaviorActionData, { type: "harvestResource" }>,
    entity: Entity,
    tick: number,
): ActionStatus {
    const root = entity.getRootEntity();
    const resourceEntity = root.findEntity(action.entityId);

    if (!resourceEntity) {
        console.warn(
            `[HarvestResource] Resource entity ${action.entityId} not found`,
        );
        return ActionFailed;
    }

    if (!isPointAdjacentTo(resourceEntity.worldPosition, entity.worldPosition)) {
        console.warn(`[HarvestResource] Worker not adjacent to resource`);
        return ActionFailed;
    }

    const resourceComponent =
        resourceEntity.getEcsComponent(ResourceComponentId);
    if (!resourceComponent) {
        console.warn(
            `[HarvestResource] Entity ${action.entityId} has no ResourceComponent`,
        );
        return ActionFailed;
    }

    const resource = getResourceById(resourceComponent.resourceId);
    if (!resource) {
        console.warn(
            `[HarvestResource] Unknown resource: ${resourceComponent.resourceId}`,
        );
        return ActionFailed;
    }

    const workerInventory = entity.requireEcsComponent(InventoryComponentId);

    if (action.harvestAction === ResourceHarvestMode.Chop) {
        return executeChopHarvest(
            root,
            entity,
            resourceEntity,
            resource,
            workerInventory,
        );
    } else {
        return executeWorkHarvest(
            root,
            entity,
            resourceEntity,
            resource,
            workerInventory,
            action,
            tick,
        );
    }
}

function executeChopHarvest(
    root: Entity,
    worker: Entity,
    resourceEntity: Entity,
    resource: NaturalResource,
    workerInventory: InventoryComponent,
): ActionStatus {
    const healthComponent =
        resourceEntity.requireEcsComponent(HealthComponentId);

    damage(healthComponent, 10);
    resourceEntity.invalidateComponent(HealthComponentId);

    if (healthComponent.currentHp <= 0) {
        for (const yieldItem of resource.yields) {
            addInventoryItem(
                workerInventory,
                structuredClone(yieldItem.item),
                yieldItem.amount,
            );
        }
        worker.invalidateComponent(InventoryComponentId);

        resourceEntity.remove();

        const job = findJobClaimedBy(root, worker.id);
        if (job) {
            completeJobFromQueue(root, job);
        }
        return ActionComplete;
    }

    return ActionRunning;
}

function executeWorkHarvest(
    root: Entity,
    worker: Entity,
    resourceEntity: Entity,
    resource: NaturalResource,
    workerInventory: InventoryComponent,
    action: Extract<BehaviorActionData, { type: "harvestResource" }>,
    tick: number,
): ActionStatus {
    const workDuration = resource.workDuration ?? 1;

    if (action.workProgress === undefined) {
        action.workProgress = 0;
    }
    action.workProgress++;

    if (action.workProgress >= workDuration) {
        for (const yieldItem of resource.yields) {
            addInventoryItem(
                workerInventory,
                structuredClone(yieldItem.item),
                yieldItem.amount,
            );
        }
        worker.invalidateComponent(InventoryComponentId);

        applyResourceLifecycle(resourceEntity, resource, tick);

        const job = findJobClaimedBy(root, worker.id);
        if (job) {
            completeJobFromQueue(root, job);
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
        const regrowComponent = resourceEntity.getEcsComponent(RegrowComponentId);
        if (regrowComponent) {
            regrowComponent.harvestedAtTick = tick;
            resourceEntity.invalidateComponent(RegrowComponentId);
        }
    }
}
