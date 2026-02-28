import { adjacentPoints, type Point } from "../../../common/point.ts";
import { BehaviorAgentComponentId } from "../../component/BehaviorAgentComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { getWeightAtPoint } from "../path/graph/weight.ts";
import type { PositionValidator } from "./closestPositionQuery.ts";
import { queryEntity } from "./queryEntity.ts";

const DEFAULT_MAX_WEIGHT = 5;

/**
 * Returns true if at least one cardinal neighbour of `point` is walkable
 * (weight non-zero and below maxWeight), excluding `excludePoint` from
 * consideration (used to treat a hypothetical occupant as impassable).
 */
function hasWalkableCardinalNeighbour(
    point: Point,
    root: Entity,
    maxWeight: number,
    excludePoint?: Point,
): boolean {
    for (const neighbour of adjacentPoints(point)) {
        if (
            excludePoint &&
            neighbour.x === excludePoint.x &&
            neighbour.y === excludePoint.y
        ) {
            continue;
        }
        const weight = getWeightAtPoint(neighbour, root);
        if (weight !== 0 && weight < maxWeight) {
            return true;
        }
    }
    return false;
}

/**
 * Returns the list of walkable (weight > 0 and < maxWeight) cardinal
 * neighbours of `point`, treating `excludePoint` as occupied (impassable).
 */
function getFreeCardinalNeighbours(
    point: Point,
    root: Entity,
    maxWeight: number,
    excludePoint?: Point,
): Point[] {
    const free: Point[] = [];
    for (const neighbour of adjacentPoints(point)) {
        if (
            excludePoint &&
            neighbour.x === excludePoint.x &&
            neighbour.y === excludePoint.y
        ) {
            continue;
        }
        const weight = getWeightAtPoint(neighbour, root);
        if (weight !== 0 && weight < maxWeight) {
            free.push(neighbour);
        }
    }
    return free;
}

function pointKey(p: Point): string {
    return `${p.x},${p.y}`;
}

/**
 * Creates a validator for placing a building at a candidate position.
 * A candidate passes when:
 * 1. The candidate tile itself is walkable (would be occupied by the new
 *    building, so this just checks it's a valid ground tile: weight != 0).
 * 2. The candidate has at least one free cardinal neighbour after placement
 *    (so the building can be reached).
 * 3. Every existing adjacent building still has at least one free cardinal
 *    neighbour after the candidate tile is treated as occupied (so we don't
 *    block an existing building in).
 * 4. Every adjacent agent (entity with BehaviorAgentComponent) still has at
 *    least one free cardinal neighbour after placement (so we don't trap
 *    a unit).
 * 5. No two buildings share the same single free cardinal tile after
 *    placement. Working buildings require a unit to stand adjacent; two units
 *    cannot occupy the same tile, so two buildings cannot share a sole
 *    access tile.
 */
export function createBuildingPlacementValidator(
    root: Entity,
    maxWeight: number = DEFAULT_MAX_WEIGHT,
): PositionValidator {
    return (candidate: Point) => {
        // The candidate must be on a valid ground tile and currently passable
        const candidateWeight = getWeightAtPoint(candidate, root);
        if (candidateWeight === 0 || candidateWeight >= maxWeight) {
            return false;
        }

        // The new building will occupy the candidate tile, so check that at
        // least one cardinal neighbour remains passable (reachability of the
        // new building itself).
        if (!hasWalkableCardinalNeighbour(candidate, root, maxWeight)) {
            return false;
        }

        // Check that placing here doesn't block any adjacent building in.
        for (const neighbour of adjacentPoints(candidate)) {
            const entitiesAtNeighbour = queryEntity(root, neighbour);
            const hasBuilding = entitiesAtNeighbour.some((e) =>
                e.hasComponent(BuildingComponentId),
            );

            if (!hasBuilding) {
                continue;
            }

            // Simulate the candidate being occupied: does this neighbour
            // building still have at least one other free cardinal exit?
            if (
                !hasWalkableCardinalNeighbour(
                    neighbour,
                    root,
                    maxWeight,
                    candidate,
                )
            ) {
                return false;
            }
        }

        // Check that placing here doesn't trap any adjacent agent.
        for (const neighbour of adjacentPoints(candidate)) {
            const entitiesAtNeighbour = queryEntity(root, neighbour);
            const hasAgent = entitiesAtNeighbour.some((e) =>
                e.hasComponent(BehaviorAgentComponentId),
            );

            if (!hasAgent) {
                continue;
            }

            if (
                !hasWalkableCardinalNeighbour(
                    neighbour,
                    root,
                    maxWeight,
                    candidate,
                )
            ) {
                return false;
            }
        }

        // Check that no two buildings end up sharing the same single free
        // cardinal tile after placement (sole-access conflict).
        //
        // Placing `candidate` can only shrink the free-tile sets of buildings
        // adjacent to it. We check:
        //   a) The new building itself — if it has exactly one free neighbour,
        //      no other building may also depend on that tile.
        //   b) Each adjacent existing building — if it is now constrained to
        //      a single free tile, no other building (affected or not) may
        //      depend on the same tile.
        //
        // Non-affected buildings (not adjacent to `candidate`) have unchanged
        // free-tile sets; if any already relies on the same sole tile, the
        // placement creates the conflict.
        const soleAccessClaimed = new Set<string>();
        const adjacentBuildingKeys = new Set<string>();
        const soleTilesToScan: Point[] = [];

        const newBuildingFree = getFreeCardinalNeighbours(
            candidate,
            root,
            maxWeight,
        );
        if (newBuildingFree.length === 1) {
            soleAccessClaimed.add(pointKey(newBuildingFree[0]));
            soleTilesToScan.push(newBuildingFree[0]);
        }

        for (const neighbour of adjacentPoints(candidate)) {
            const entitiesAtNeighbour = queryEntity(root, neighbour);
            if (
                !entitiesAtNeighbour.some((e) =>
                    e.hasComponent(BuildingComponentId),
                )
            ) {
                continue;
            }

            adjacentBuildingKeys.add(pointKey(neighbour));

            const freeNeighbours = getFreeCardinalNeighbours(
                neighbour,
                root,
                maxWeight,
                candidate,
            );

            if (freeNeighbours.length === 1) {
                const tileKey = pointKey(freeNeighbours[0]);
                if (soleAccessClaimed.has(tileKey)) {
                    return false;
                }
                soleAccessClaimed.add(tileKey);
                soleTilesToScan.push(freeNeighbours[0]);
            }
        }

        // For each sole-access tile of an affected building, scan non-affected
        // buildings adjacent to it. A non-affected building's free-tile set is
        // unchanged; if it already depends on the same sole tile, the placement
        // introduces a conflict that did not exist before.
        for (const soleTile of soleTilesToScan) {
            for (const adj of adjacentPoints(soleTile)) {
                const adjKey = pointKey(adj);
                if (adjKey === pointKey(candidate)) {
                    continue;
                }
                if (adjacentBuildingKeys.has(adjKey)) {
                    continue;
                }

                const entities = queryEntity(root, adj);
                if (
                    !entities.some((e) => e.hasComponent(BuildingComponentId))
                ) {
                    continue;
                }

                const freeNeighbours = getFreeCardinalNeighbours(
                    adj,
                    root,
                    maxWeight,
                );
                if (
                    freeNeighbours.length === 1 &&
                    freeNeighbours[0].x === soleTile.x &&
                    freeNeighbours[0].y === soleTile.y
                ) {
                    return false;
                }
            }
        }

        return true;
    };
}
