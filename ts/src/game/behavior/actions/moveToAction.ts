import type { Point } from "../../../common/point.ts";
import { isPointAdjacentTo, pointEquals } from "../../../common/point.ts";
import { createLogger } from "../../../common/logging/logger.ts";

const log = createLogger("behavior");
import {
    BehaviorAgentComponentId,
    getBehaviorAgent,
} from "../../component/BehaviorAgentComponent.ts";
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
import { spendEntityEnergy } from "../../component/energyComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { discoverAfterMovement } from "../../job/movementHelper.ts";
import { getPathfindingGraphForEntity } from "../../map/path/getPathfindingGraphForEntity.ts";
import type { GraphNode } from "../../map/path/graph/graph.ts";
import { queryEntity } from "../../map/query/queryEntity.ts";
import {
    PathResultStatus,
    queryPath,
    type QueryPathOptions,
} from "../../map/query/pathQuery.ts";
import { isImpassableResource } from "../../../data/inventory/items/naturalResource.ts";
import { negotiateDisplacement } from "../displacement/displacementNegotiation.ts";
import { commitDisplacementTransaction } from "../displacement/displacementTransaction.ts";
import {
    ActionComplete,
    ActionRunning,
    type ActionResult,
    type BehaviorActionData,
} from "./Action.ts";

/**
 * Maximum number of immediate replans within a single tick after proving a tile
 * impassable via failed displacement. In practice this terminates in 1–2 iterations;
 * the cap guards against bugs in the blocked-tile accumulation.
 */
const MAX_REPLAN_ATTEMPTS = 10;

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
    spendEntityEnergy(entity, 1);
}

/**
 * Returns a weight modifier that makes structures (non-road buildings and large
 * resources such as trees and stone) fully impassable, and optionally treats any
 * tiles in `locallyBlocked` as impassable too. Passable resources (grass, flowers,
 * mushrooms) and all entity tiles keep their original graph weight so that
 * displacement negotiation still fires for entity-occupied tiles.
 *
 * GraphNode coordinates are in graph space (world + offset), so we subtract the
 * graph offset to convert back to world coordinates before querying entities.
 */
function makePathModifier(
    root: Entity,
    offsetX: number,
    offsetY: number,
    locallyBlocked: Set<string>,
): (node: GraphNode) => number {
    return (node) => {
        const wx = node.x - offsetX;
        const wy = node.y - offsetY;

        if (locallyBlocked.size > 0 && locallyBlocked.has(`${wx},${wy}`)) {
            return 0;
        }

        const occupants = queryEntity(root, { x: wx, y: wy });
        for (const occupant of occupants) {
            if (occupant.hasComponent(BuildingComponentId)) {
                const b = occupant.getEcsComponent(BuildingComponentId);
                if (b && b.building.id !== "road") return 0;
            }
            if (occupant.hasComponent(ResourceComponentId)) {
                const r = occupant.getEcsComponent(ResourceComponentId);
                if (r && isImpassableResource(r.resourceId)) return 0;
            }
        }

        return node.weight;
    };
}

/**
 * Plan a path from `from` to `target`. Buildings and large resources are always
 * treated as impassable. Any tiles in `locallyBlocked` are also blocked — these
 * accumulate within a tick when displacement negotiation fails for a tile.
 * Returns the path array or null if no path exists.
 */
function planPath(
    pathfindingGraph: ReturnType<typeof getPathfindingGraphForEntity>,
    root: Entity,
    from: Point,
    target: Point,
    stopAdjacent: "cardinal" | "diagonal" | undefined,
    locallyBlocked: Set<string>,
): Point[] | null {
    if (!pathfindingGraph) return null;

    const { offsetX, offsetY } = pathfindingGraph.graph;
    const pathOptions: QueryPathOptions = {
        allowAdjacentStop: !!stopAdjacent,
        weightModifier: makePathModifier(root, offsetX, offsetY, locallyBlocked),
    };

    const result = queryPath(pathfindingGraph, from, target, pathOptions);

    const isValid =
        result.status === PathResultStatus.Complete ||
        result.status === PathResultStatus.Partial;

    return isValid && result.path.length > 0 ? result.path : null;
}

/**
 * Move to a target position, negotiating displacement with blocking entities when needed.
 *
 * This function owns the full movement pipeline:
 *   pathfinding → occupancy check → displacement negotiation → position assignment
 *
 * A path is computed once and cached on the action data. Subsequent ticks follow the
 * cached path without re-running A*, committing the entity to the planned route. The
 * cache is only cleared when the next tile proves impassable (displacement refused or
 * no viable chain), at which point a local replan is performed immediately with that
 * tile treated as a wall. This prevents oscillation — without caching, A* would
 * rediscover the same blocked route on every tick and the entity would cycle in place.
 *
 * Displacement uses the entity's currentBehaviorUtility as its negotiation priority.
 * A higher-priority entity can displace idle or low-priority entities that block its path.
 *
 * Returns:
 *   "complete" — arrived at target (or adjacent, if stopAdjacent is set)
 *   "running"  — still en route, or waiting for blockers to clear
 *   "failed"   — path is permanently blocked (building, resource, no graph, no path)
 */
export function executeMoveToAction(
    action: Extract<BehaviorActionData, { type: "moveTo" }>,
    entity: Entity,
    tick: number,
): ActionResult {
    if (hasArrived(entity.worldPosition, action.target, action.stopAdjacent)) {
        log.info(
            `${entity.id} arrived at (${entity.worldPosition.x},${entity.worldPosition.y})`,
        );
        return ActionComplete;
    }

    const root = entity.getRootEntity();
    const pathfindingGraph = getPathfindingGraphForEntity(root, entity);
    if (!pathfindingGraph) {
        log.warn(`${entity.id} no pathfinding graph, failing`);
        return {
            kind: "failed",
            cause: { type: "pathBlocked", target: action.target },
        };
    }

    // Compute a path if we don't have one cached. The cache persists across ticks so
    // the entity commits to a route rather than reconsidering on every tick.
    if (!action.cachedPath || action.cachedPath.length === 0) {
        const path = planPath(
            pathfindingGraph,
            root,
            entity.worldPosition,
            action.target,
            action.stopAdjacent,
            new Set(),
        );
        if (!path) {
            if (
                hasArrived(
                    entity.worldPosition,
                    action.target,
                    action.stopAdjacent,
                )
            ) {
                log.info(
                    `${entity.id} arrived at (${entity.worldPosition.x},${entity.worldPosition.y}) via stopAdjacent fallback`,
                );
                return ActionComplete;
            }
            log.info(
                `${entity.id} no path to (${action.target.x},${action.target.y}), failing`,
            );
            return {
                kind: "failed",
                cause: { type: "pathBlocked", target: action.target },
            };
        }
        action.cachedPath = path;
    }

    // The locallyBlocked set accumulates tiles proven impassable within this tick.
    // It is used only for immediate within-tick replanning and is discarded afterward.
    const locallyBlocked = new Set<string>();

    for (let attempt = 0; attempt <= MAX_REPLAN_ATTEMPTS; attempt++) {
        const nextPoint = action.cachedPath[0];
        if (!nextPoint) {
            // Path exhausted without arriving — should not happen in normal flow.
            action.cachedPath = undefined;
            return ActionRunning;
        }

        if (
            hasArrived(entity.worldPosition, action.target, action.stopAdjacent)
        ) {
            log.info(
                `${entity.id} arrived at (${entity.worldPosition.x},${entity.worldPosition.y})`,
            );
            return ActionComplete;
        }

        const occupants = queryEntity(root, nextPoint);

        // Buildings and resources are impassable — displacement doesn't apply.
        const hasStructure = occupants.some(
            (o) =>
                o.hasComponent(BuildingComponentId) ||
                o.hasComponent(ResourceComponentId),
        );
        if (hasStructure) {
            if (
                hasArrived(
                    entity.worldPosition,
                    action.target,
                    action.stopAdjacent,
                )
            ) {
                log.info(
                    `${entity.id} arrived at (${entity.worldPosition.x},${entity.worldPosition.y}) via stopAdjacent fallback`,
                );
                return ActionComplete;
            }
            log.info(
                `${entity.id} path blocked by structure at (${nextPoint.x},${nextPoint.y})`,
            );
            action.cachedPath = undefined;
            return {
                kind: "failed",
                cause: { type: "pathBlocked", target: action.target },
            };
        }

        // Entities with behavior agents can be asked to step aside.
        const displaceable = occupants.filter((o) =>
            o.hasComponent(BehaviorAgentComponentId),
        );
        if (displaceable.length > 0) {
            const agent = getBehaviorAgent(entity);
            const priority = agent?.currentBehaviorUtility ?? 0;
            const blockerIds = displaceable.map((o) => o.id).join(", ");
            log.info(
                `${entity.id} next tile (${nextPoint.x},${nextPoint.y}) blocked by [${blockerIds}], priority=${priority}, attempting displacement`,
            );

            const result = negotiateDisplacement(
                entity,
                nextPoint,
                priority,
                root,
                tick,
            );

            if (result.kind === "refused" || result.kind === "noChain") {
                // This tile is proven impassable for this tick. Clear the stale cached
                // path and replan immediately with this tile blocked.
                log.info(
                    `${entity.id} displacement ${result.kind} at (${nextPoint.x},${nextPoint.y}), replanning`,
                );
                locallyBlocked.add(`${nextPoint.x},${nextPoint.y}`);
                action.cachedPath = undefined;

                const newPath = planPath(
                    pathfindingGraph,
                    root,
                    entity.worldPosition,
                    action.target,
                    action.stopAdjacent,
                    locallyBlocked,
                );

                if (!newPath) {
                    // No path around the blocked tiles. Wait — the blockers may move next tick.
                    // Leave cachedPath undefined so we plan fresh on the next tick.
                    log.info(
                        `${entity.id} no path around blocked tiles, waiting`,
                    );
                    return ActionRunning;
                }

                action.cachedPath = newPath;
                continue;
            }

            const committed = commitDisplacementTransaction(
                result.transaction,
                root,
                tick,
                entity.id,
            );
            if (committed) {
                // Cycle: the transaction repositioned all entities atomically including us.
                if (
                    hasArrived(
                        entity.worldPosition,
                        action.target,
                        action.stopAdjacent,
                    )
                ) {
                    log.info(
                        `${entity.id} displacement cycle committed, arrived at (${entity.worldPosition.x},${entity.worldPosition.y})`,
                    );
                    return ActionComplete;
                }
                // Non-cycle: chain cleared the target tile, step into it.
                if (!result.transaction.isCycle) {
                    applyRequesterStep(
                        entity,
                        entity.worldPosition,
                        nextPoint,
                        tick,
                    );
                    action.cachedPath = action.cachedPath.slice(1);
                    log.info(
                        `${entity.id} displaced chain, stepped to (${entity.worldPosition.x},${entity.worldPosition.y})`,
                    );
                    if (
                        hasArrived(
                            entity.worldPosition,
                            action.target,
                            action.stopAdjacent,
                        )
                    ) {
                        return ActionComplete;
                    }
                }
                return ActionRunning;
            }

            // Stale transaction: world changed between negotiation and commit.
            // Keep the cached path — this is a timing issue, not proof of impassability.
            log.info(
                `${entity.id} displacement transaction stale, waiting`,
            );
            return ActionRunning;
        }

        // Tile is free — step into it.
        applyRequesterStep(entity, entity.worldPosition, nextPoint, tick);
        action.cachedPath = action.cachedPath.slice(1);
        log.info(
            `${entity.id} stepped to (${entity.worldPosition.x},${entity.worldPosition.y})`,
        );
        if (
            hasArrived(entity.worldPosition, action.target, action.stopAdjacent)
        ) {
            return ActionComplete;
        }
        return ActionRunning;
    }

    // Safety cap: exceeded max replan attempts within one tick.
    log.warn(`${entity.id} exceeded max replan attempts, waiting`);
    action.cachedPath = undefined;
    return ActionRunning;
}
