import {
    adjacentPoints,
    encodePosition,
    type Point,
} from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { getWeightAtPoint } from "../path/graph/weight.ts";

/**
 * Finds the closest walkable position to an entity using breadth-first search
 * @param root The root entity containing the map data
 * @param startPosition The starting position to search from
 * @param maxWeight The maximum weight considered walkable (default: 5)
 * @returns The closest walkable position, or null if none found
 */
export function findClosestAvailablePosition(
    root: Entity,
    startPosition: Point,
    maxWeight: number = 5,
): Point | null {
    const positionsToVisit: Point[] = [startPosition];
    const visitedPositions = new Set<Point>();

    while (positionsToVisit.length > 0) {
        const currentPosition = positionsToVisit.shift();
        if (!currentPosition) {
            return null;
        }

        if (visitedPositions.has(currentPosition)) {
            continue;
        }
        visitedPositions.add(currentPosition);

        // Check if this position is walkable
        const weight = getWeightAtPoint(currentPosition, root);

        if (weight === 0) {
            // Not a valid tile
            continue;
        }

        if (weight < maxWeight) {
            // Found a walkable position
            return currentPosition;
        }

        // Add adjacent positions to search
        const adjacent = adjacentPoints(currentPosition);
        positionsToVisit.push(...adjacent);
    }

    return null;
}
