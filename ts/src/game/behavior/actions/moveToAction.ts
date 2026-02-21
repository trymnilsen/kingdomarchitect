import type { Point } from "../../../common/point.ts";
import {
    isPointAdjacentTo,
    pointEquals,
} from "../../../common/point.ts";
import { BehaviorAgentComponentId, getBehaviorAgent } from "../../component/BehaviorAgentComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import {
    DirectionComponentId,
    updateDirectionComponent,
} from "../../component/directionComponent.ts";
import {
    MovementStaminaComponentId,
    recordMove,
} from "../../component/movementStaminaComponent.ts";
import { ResourceComponentId } from "../../component/resourceComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { discoverAfterMovement } from "../../job/movementHelper.ts";
import { getPathfindingGraphForEntity } from "../../map/path/getPathfindingGraphForEntity.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import {
    PathResultStatus,
    queryPath,
    type QueryPathOptions,
} from "../../map/query/pathQuery.ts";
import { negotiateDisplacement } from "../displacement/displacementNegotiation.ts";
import { commitDisplacementTransaction } from "../displacement/displacementTransaction.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
    type BehaviorActionData,
} from "./Action.ts";

/**
 * Check if two points are diagonally adjacent (including cardinal directions).
 */
function isPointAdjacentDiagonal(pointA: Point, pointB: Point): boolean {
    const dx = Math.abs(pointA.x - pointB.x);
    const dy = Math.abs(pointA.y - pointB.y);
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
 * Move the requester one step from `from` to `to`, updating direction,
 * fog of war, and stamina tracking. Called after the next tile is confirmed clear.
 */
function applyRequesterStep(
    entity: Entity,
    from: Point,
    to: Point,
    tick: number,
): void {
    discoverAfterMovement(entity, to);
    entity.updateComponent(DirectionComponentId, (component) => {
        updateDirectionComponent(component, from, to);
    });
    entity.worldPosition = to;
    const stamina = entity.getEcsComponent(MovementStaminaComponentId);
    if (stamina) {
        recordMove(stamina, tick);
        entity.invalidateComponent(MovementStaminaComponentId);
    }
}

/**
 * Move to a target position, negotiating displacement with blocking entities when needed.
 *
 * This function owns the full movement pipeline:
 *   pathfinding → occupancy check → displacement negotiation → position assignment
 *
 * Displacement uses the entity's currentBehaviorUtility as its negotiation priority.
 * A higher-priority entity can displace idle or low-priority entities that block its path.
 *
 * Returns:
 *   "complete" — arrived at target (or adjacent, if stopAdjacent is set)
 *   "running"  — still en route, or blocked by an entity that might move next tick
 *   "failed"   — path is permanently blocked (building, resource, no graph)
 */
export function executeMoveToAction(
    action: Extract<BehaviorActionData, { type: "moveTo" }>,
    entity: Entity,
    tick: number,
): ActionResult {
    if (hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
        console.log(
            `[MoveTo] ${entity.id} arrived at (${entity.worldPosition.x},${entity.worldPosition.y})`,
        );
        return ActionComplete;
    }

    const root = entity.getRootEntity();
    const pathfindingGraph = getPathfindingGraphForEntity(root, entity);
    if (!pathfindingGraph) {
        console.warn(`[MoveTo] ${entity.id} no pathfinding graph, failing`);
        return { kind: "failed", cause: { type: "pathBlocked", target: action.target } };
    }

    const pathOptions: QueryPathOptions = { allowAdjacentStop: !!action.stopAdjacent };
    const path = queryPath(pathfindingGraph, entity.worldPosition, action.target, pathOptions);

    const isValidPath =
        path.status === PathResultStatus.Complete ||
        path.status === PathResultStatus.Partial;
    const nextPoint = path.path[0];

    if (!isValidPath || !nextPoint) {
        if (action.stopAdjacent && hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
            console.log(
                `[MoveTo] ${entity.id} arrived at (${entity.worldPosition.x},${entity.worldPosition.y}) via stopAdjacent fallback`,
            );
            return ActionComplete;
        }
        console.log(
            `[MoveTo] ${entity.id} no path to (${action.target.x},${action.target.y}), status=${path.status}`,
        );
        return { kind: "failed", cause: { type: "pathBlocked", target: action.target } };
    }

    const occupants = queryEntity(root, nextPoint);

    // Buildings and resources are impassable — displacement doesn't apply to them.
    const hasStructure = occupants.some(
        (o) =>
            o.hasComponent(BuildingComponentId) || o.hasComponent(ResourceComponentId),
    );
    if (hasStructure) {
        if (action.stopAdjacent && hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
            console.log(
                `[MoveTo] ${entity.id} arrived at (${entity.worldPosition.x},${entity.worldPosition.y}) via stopAdjacent fallback`,
            );
            return ActionComplete;
        }
        console.log(
            `[MoveTo] ${entity.id} path blocked by structure at (${nextPoint.x},${nextPoint.y})`,
        );
        return { kind: "failed", cause: { type: "pathBlocked", target: action.target } };
    }

    // Entities with behavior agents can be asked to step aside.
    const displaceable = occupants.filter((o) => o.hasComponent(BehaviorAgentComponentId));
    if (displaceable.length > 0) {
        const agent = getBehaviorAgent(entity);
        const priority = agent?.currentBehaviorUtility ?? 0;
        const blockerIds = displaceable.map((o) => o.id).join(", ");
        console.log(
            `[MoveTo] ${entity.id} next tile (${nextPoint.x},${nextPoint.y}) blocked by [${blockerIds}], priority=${priority}, attempting displacement`,
        );
        const transaction = negotiateDisplacement(entity, nextPoint, priority, root, tick);
        if (transaction) {
            const committed = commitDisplacementTransaction(transaction, root, tick, entity.id);
            if (committed) {
                // Cycle: the transaction already repositioned all entities atomically,
                // including this entity. Check arrival based on the new position.
                if (hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
                    console.log(
                        `[MoveTo] ${entity.id} displacement cycle committed, arrived at (${entity.worldPosition.x},${entity.worldPosition.y})`,
                    );
                    return ActionComplete;
                }
                // Non-cycle: the chain moved displaced entities; the target tile is now free.
                if (!transaction.isCycle) {
                    applyRequesterStep(entity, entity.worldPosition, nextPoint, tick);
                    console.log(
                        `[MoveTo] ${entity.id} displaced chain, stepped to (${entity.worldPosition.x},${entity.worldPosition.y})`,
                    );
                    if (hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
                        return ActionComplete;
                    }
                }
                return ActionRunning;
            }
            console.log(`[MoveTo] ${entity.id} displacement transaction stale, waiting`);
        } else {
            console.log(`[MoveTo] ${entity.id} displacement negotiation failed, waiting`);
        }
        // Displacement failed or stale — the blocker may move next tick, so keep trying.
        return ActionRunning;
    }

    // Tile is free — step into it.
    applyRequesterStep(entity, entity.worldPosition, nextPoint, tick);
    console.log(
        `[MoveTo] ${entity.id} stepped to (${entity.worldPosition.x},${entity.worldPosition.y})`,
    );
    if (hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
        return ActionComplete;
    }
    return ActionRunning;
}
