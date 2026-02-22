import {
    adjacentPoints,
    encodePosition,
    type Point,
} from "../../../common/point.ts";
import type { Entity } from "../../entity/entity.ts";
import { getWeightAtPoint } from "../path/graph/weight.ts";

/**
 * A function that returns true if a candidate position is valid for placement.
 */
export type PositionValidator = (point: Point) => boolean;

/**
 * Creates the default walkability validator using weight thresholds.
 * A position is valid when its weight is non-zero and below maxWeight.
 */
export function createWalkableValidator(
    root: Entity,
    maxWeight: number = 5,
): PositionValidator {
    return (point: Point) => {
        const weight = getWeightAtPoint(point, root);
        return weight !== 0 && weight < maxWeight;
    };
}

/**
 * Finds the closest position passing the validator using breadth-first search.
 * Both input and output positions are in world coordinates.
 * @param root The root entity containing the map data
 * @param startPosition The world position to search from
 * @param validator Predicate that returns true when a candidate is acceptable
 * @returns The closest valid world position, or null if none found
 */
export function findClosestAvailablePosition(
    root: Entity,
    startPosition: Point,
    validator: PositionValidator = createWalkableValidator(root),
): Point | null {
    const positionsToVisit: Point[] = [startPosition];
    const visitedPositions = new Set<number>();

    while (positionsToVisit.length > 0) {
        const currentPosition = positionsToVisit.shift();
        if (!currentPosition) {
            return null;
        }

        const positionKey = encodePosition(
            currentPosition.x,
            currentPosition.y,
        );
        if (visitedPositions.has(positionKey)) {
            continue;
        }
        visitedPositions.add(positionKey);

        if (validator(currentPosition)) {
            return currentPosition;
        }

        // Add adjacent positions to search
        const adjacent = adjacentPoints(currentPosition);
        positionsToVisit.push(...adjacent);
    }

    return null;
}
