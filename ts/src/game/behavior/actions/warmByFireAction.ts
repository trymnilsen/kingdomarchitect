import { FireSourceComponentId } from "../../component/fireSourceComponent.ts";
import {
    WarmthComponentId,
    increaseWarmth,
} from "../../component/warmthComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import type { Point } from "../../../common/point.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
    type BehaviorActionData,
} from "./Action.ts";

/**
 * Check if two points are within 1 tile of each other (8-directional adjacency).
 * Uses Chebyshev distance (max of abs differences) rather than Manhattan so that
 * diagonal neighbors count — a goblin standing diagonally next to a campfire
 * should still be able to warm up.
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
): ActionResult {
    const warmth = entity.getEcsComponent(WarmthComponentId);

    if (!warmth) {
        console.warn(
            `[WarmByFireAction] Entity ${entity.id} has no warmth component`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    const root = entity.getRootEntity();
    const fireEntity = root.findEntity(action.fireEntityId);

    if (!fireEntity) {
        console.warn(
            `[WarmByFireAction] Fire entity ${action.fireEntityId} not found`,
        );
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.fireEntityId },
        };
    }

    const fireSource = fireEntity.getEcsComponent(FireSourceComponentId);

    if (!fireSource) {
        console.warn(
            `[WarmByFireAction] Entity ${action.fireEntityId} has no FireSourceComponent`,
        );
        return { kind: "failed", cause: { type: "unknown" } };
    }

    if (!fireSource.isActive) {
        console.warn(`[WarmByFireAction] Fire is not active`);
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.fireEntityId },
        };
    }

    // Check adjacency (must be within 1 tile, including diagonals)
    if (!isWithinOneTile(entity.worldPosition, fireEntity.worldPosition)) {
        console.warn(`[WarmByFireAction] Entity not adjacent to fire`);
        return { kind: "failed", cause: { type: "notAdjacent" } };
    }

    // Apply active warming rate
    increaseWarmth(warmth, fireSource.activeWarmthRate);
    entity.invalidateComponent(WarmthComponentId);

    // Complete at 100 (fully warm), not at COLD_THRESHOLD (50).
    // If we stopped at 50 the goblin would immediately be eligible for keepWarm
    // again on the very next tick and thrash between warming and working.
    // Warming to full gives it a long buffer before the next keepWarm activation.
    if (warmth.warmth >= 90) {
        console.log(`[WarmByFireAction] Entity ${entity.id} is fully warm`);
        return ActionComplete;
    }

    return ActionRunning;
}
