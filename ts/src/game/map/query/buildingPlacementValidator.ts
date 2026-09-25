import { adjacentPoints, type Point } from "../../../common/point.ts";
import { BehaviorAgentComponentId } from "../../component/behaviorAgentComponent.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import {
    getTerrainAt,
    TileComponentId,
} from "../../component/tileComponent.ts";
import { getOccupantWeight, getTerrainWeight } from "../path/graph/weight.ts";
import { isBuildableTerrain } from "../terrain.ts";
import type { PositionValidator } from "./closestPositionQuery.ts";
import { queryEntity } from "./queryEntity.ts";

const MaxOpenTileOccupantWeight = 5;

function isOpenTile(point: Point, root: Entity): boolean {
    return (
        getTerrainWeight(point, root) > 0 &&
        getOccupantWeight(point, root) < MaxOpenTileOccupantWeight
    );
}

function getOpenCardinalNeighbours(
    point: Point,
    root: Entity,
    excludePoint?: Point,
): Point[] {
    return adjacentPoints(point).filter(
        (neighbour) =>
            !(
                excludePoint &&
                neighbour.x === excludePoint.x &&
                neighbour.y === excludePoint.y
            ) && isOpenTile(neighbour, root),
    );
}

function hasOpenCardinalNeighbour(
    point: Point,
    root: Entity,
    excludePoint?: Point,
): boolean {
    return getOpenCardinalNeighbours(point, root, excludePoint).length > 0;
}

function pointKey(p: Point): string {
    return `${p.x},${p.y}`;
}

/**
 * Creates a validator for placing a building at a candidate position.
 * A candidate passes when:
 * 1. The candidate tile has buildable terrain and is currently passable.
 * 2. The candidate has at least one free cardinal neighbour after placement
 *    (so the building can be reached).
 * 3. Every existing adjacent building still has at least one free cardinal
 *    neighbour after the candidate tile is treated as occupied (so we don't
 *    block an existing building in).
 * 4. Every adjacent agent (entity with BehaviorAgentComponent) still has at
 *    least one free cardinal neighbour after placement (so we don't trap
 *    a unit).
 * 5. No two buildings share the same single free cardinal tile after
 *    placement. Working buildings require a unit to stand adjacent. Two units
 *    cannot occupy the same tile, so two buildings cannot share a sole
 *    access tile.
 */
export function createBuildingPlacementValidator(
    root: Entity,
): PositionValidator {
    const tileComponent = root.requireEcsComponent(TileComponentId);
    return (candidate: Point) => {
        // ice is walkable but not buildable
        const terrain = getTerrainAt(tileComponent, candidate);
        if (terrain === null || !isBuildableTerrain(terrain)) {
            return false;
        }

        if (!isOpenTile(candidate, root)) {
            return false;
        }

        // The new building will occupy the candidate tile, so check that at
        // least one cardinal neighbour remains open (reachability of the new
        // building itself).
        if (!hasOpenCardinalNeighbour(candidate, root)) {
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
            if (!hasOpenCardinalNeighbour(neighbour, root, candidate)) {
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

            if (!hasOpenCardinalNeighbour(neighbour, root, candidate)) {
                return false;
            }
        }

        // No two buildings may end up depending on the same single free tile.
        // Placing here can only shrink the free-tile sets of buildings adjacent
        // to the candidate, so those are the ones to re-check, along with any
        // building further out that already relies on one of the sole tiles
        // this placement creates.
        const soleAccessClaimed = new Set<string>();
        const adjacentBuildingKeys = new Set<string>();
        const soleTilesToScan: Point[] = [];

        const newBuildingFree = getOpenCardinalNeighbours(candidate, root);
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

            const freeNeighbours = getOpenCardinalNeighbours(
                neighbour,
                root,
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

        // A building further from the candidate keeps its free-tile set, so it
        // only conflicts if it already depends on one of these sole tiles.
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

                const freeNeighbours = getOpenCardinalNeighbours(adj, root);
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
