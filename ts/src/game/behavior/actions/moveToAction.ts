import {
    isPointAdjacentTo,
    pointEquals,
    type Point,
} from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { doMovement, MovementResult } from "../../job/movementHelper.ts";
import { blockBuildingsModifier } from "../../map/query/pathQuery.ts";
import type { ActionStatus, BehaviorActionData } from "./Action.ts";

/**
 * Check if two points are diagonally adjacent (including cardinal directions).
 */
function isPointAdjacentDiagonal(pointA: Point, pointB: Point): boolean {
    const dx = Math.abs(pointA.x - pointB.x);
    const dy = Math.abs(pointA.y - pointB.y);
    // Adjacent if within 1 tile in both directions, but not the same point
    return dx <= 1 && dy <= 1 && (dx > 0 || dy > 0);
}

/**
 * Check if position is considered "arrived" based on stopAdjacent mode.
 */
function hasArrived(
    position: Point,
    target: Point,
    stopAdjacent: "cardinal" | "diagonal" | undefined,
): boolean {
    if (pointEquals(position, target)) {
        return true;
    }
    if (stopAdjacent === "cardinal") {
        return isPointAdjacentTo(position, target);
    }
    if (stopAdjacent === "diagonal") {
        return isPointAdjacentDiagonal(position, target);
    }
    return false;
}

/**
 * Move to a target position (general movement).
 * If stopAdjacent is set, completes when adjacent to target instead of at target.
 */
export function executeMoveToAction(
    action: Extract<BehaviorActionData, { type: "moveTo" }>,
    entity: Entity,
): ActionStatus {
    // Check if already arrived (at target or adjacent if allowed)
    if (hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
        return "complete";
    }

    const result = doMovement(entity, action.target, {
        allowAdjacentStop: !!action.stopAdjacent,
        weightModifier: blockBuildingsModifier,
    });

    if (result === MovementResult.Failure) {
        // If movement failed but we're adjacent and that's acceptable, complete
        if (
            action.stopAdjacent &&
            hasArrived(entity.worldPosition, action.target, action.stopAdjacent)
        ) {
            return "complete";
        }
        return "failed";
    }

    // Check if arrived after movement
    if (hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
        return "complete";
    }

    return "running";
}
