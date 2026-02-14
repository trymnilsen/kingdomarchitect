import { FireSourceComponentId } from "../../component/fireSourceComponent.ts";
import {
    WarmthComponentId,
    increaseWarmth,
} from "../../component/warmthComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { Point } from "../../../common/point.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Check if two points are within 1 tile of each other (8-directional adjacency).
 * Uses chebyshev distance (max of abs differences).
 */
function isWithinOneTile(a: Point, b: Point): boolean {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.max(dx, dy) <= 1;
}

/**
 * Warm by fire action - recovers warmth when adjacent to an active fire source.
 * Returns complete when warmth reaches 100.
 */
export function executeWarmByFireAction(
    action: Extract<BehaviorActionData, { type: "warmByFire" }>,
    entity: Entity,
): ActionStatus {
    const warmth = entity.getEcsComponent(WarmthComponentId);

    if (!warmth) {
        console.warn(
            `[WarmByFireAction] Entity ${entity.id} has no warmth component`,
        );
        return "failed";
    }

    const root = entity.getRootEntity();
    const fireEntity = root.findEntity(action.fireEntityId);

    if (!fireEntity) {
        console.warn(
            `[WarmByFireAction] Fire entity ${action.fireEntityId} not found`,
        );
        return "failed";
    }

    const fireSource = fireEntity.getEcsComponent(FireSourceComponentId);

    if (!fireSource) {
        console.warn(
            `[WarmByFireAction] Entity ${action.fireEntityId} has no FireSourceComponent`,
        );
        return "failed";
    }

    if (!fireSource.isActive) {
        console.warn(`[WarmByFireAction] Fire is not active`);
        return "failed";
    }

    // Check adjacency (must be within 1 tile, including diagonals)
    if (!isWithinOneTile(entity.worldPosition, fireEntity.worldPosition)) {
        console.warn(`[WarmByFireAction] Entity not adjacent to fire`);
        return "failed";
    }

    // Apply active warming rate
    increaseWarmth(warmth, fireSource.activeWarmthRate);
    entity.invalidateComponent(WarmthComponentId);

    // Complete when fully warm
    if (warmth.warmth >= 100) {
        console.log(`[WarmByFireAction] Entity ${entity.id} is fully warm`);
        return "complete";
    }

    return "running";
}
