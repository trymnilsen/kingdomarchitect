import { adjacentPoints, type Point } from "../../../common/point.ts";
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
 * Creates a validator for placing a building at a candidate position.
 * A candidate passes when:
 * 1. The candidate tile itself is walkable (would be occupied by the new
 *    building, so this just checks it's a valid ground tile: weight != 0).
 * 2. The candidate has at least one free cardinal neighbour after placement
 *    (so the building can be reached).
 * 3. Every existing adjacent building still has at least one free cardinal
 *    neighbour after the candidate tile is treated as occupied (so we don't
 *    block an existing building in).
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

        return true;
    };
}
