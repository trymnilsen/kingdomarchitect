import { isPointAdjacentTo } from "../../../common/point.ts";
import { log } from "../../../common/logging/logger.ts";
import {
    getResourceById,
    isClearableObstacle,
} from "../../../data/inventory/items/naturalResource.ts";
import { damage, HealthComponentId } from "../../component/healthComponent.ts";
import { spendEntityEnergy } from "../../component/energyComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { dropItemAtPosition, DropMode } from "../dropItem.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./Action.ts";

/**
 * Remove a resource that is blocking a path. Unlike harvestResource this never
 * collects yields into the worker's held slot — the worker is clearing an
 * obstacle on the way somewhere, not harvesting it. When the resource dies its
 * yields are scattered onto the nearest free tiles so they remain collectable.
 *
 * Damage is dealt per tick (the resource is felled over several ticks) and the
 * entity is removed on death regardless of its lifecycle: a path-clear destroys
 * the obstacle outright rather than letting infinite nodes reset in place.
 */
export type ClearObstacleActionData = {
    type: "clearObstacle";
    entityId: string;
};

const CLEAR_DAMAGE_PER_TICK = 10;

export function executeClearObstacleAction(
    action: ClearObstacleActionData,
    entity: Entity,
): ActionResult {
    const root = entity.getRootEntity();
    const resourceEntity = root.findEntity(action.entityId);

    if (!resourceEntity) {
        // Already gone — the path is clear.
        return ActionComplete;
    }

    if (
        !isPointAdjacentTo(resourceEntity.worldPosition, entity.worldPosition)
    ) {
        log.warn(`Worker not adjacent to obstacle ${action.entityId}`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    const resourceComponent =
        resourceEntity.getEcsComponent(ResourceComponentId);
    if (
        resourceComponent &&
        !isClearableObstacle(resourceComponent.resourceId)
    ) {
        // Only removable obstacles (trees) may be cleared. A permanent node
        // (stone) reaching this action is a bug — pathfinding should have
        // routed around it. Refuse rather than destroy an infinite resource.
        log.error(
            `Refusing to clear non-clearable obstacle ${action.entityId} (${resourceComponent.resourceId})`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const healthComponent = resourceEntity.getEcsComponent(HealthComponentId);
    if (!healthComponent) {
        // Nothing to whittle down — just remove it to clear the way.
        scatterYields(root, resourceEntity);
        resourceEntity.remove();
        return ActionComplete;
    }

    damage(healthComponent, CLEAR_DAMAGE_PER_TICK);
    resourceEntity.invalidateComponent(HealthComponentId);
    spendEntityEnergy(entity, 2);

    if (healthComponent.currentHp <= 0) {
        scatterYields(root, resourceEntity);
        resourceEntity.remove();
        return ActionComplete;
    }

    return ActionRunning;
}

/**
 * Scatter the resource's yields onto the nearest free tiles around it. The
 * resource tile itself is impassable, so DropMode.Nearest places the piles on
 * adjacent walkable tiles.
 */
function scatterYields(root: Entity, resourceEntity: Entity): void {
    const resourceComponent =
        resourceEntity.getEcsComponent(ResourceComponentId);
    if (!resourceComponent) return;

    const resource = getResourceById(resourceComponent.resourceId);
    if (!resource) return;

    for (const yieldItem of resource.yields) {
        dropItemAtPosition(
            root,
            resourceEntity.worldPosition,
            structuredClone(yieldItem.item),
            yieldItem.amount,
            `${yieldItem.item.name} yielded from clearing ${resource.name}`,
            DropMode.Nearest,
        );
    }
}
