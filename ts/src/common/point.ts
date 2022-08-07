import { Direction } from "./direction";

/**
 * A point represents a pair of numbers used to represent a point in space
 * The point does not take into account the type of space. It can be both
 * in screenspace, worldspace or "tile space".
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * A point with both components set to zero
 */
export const zeroPoint: { readonly x: 0; readonly y: 0 } = {
    x: 0,
    y: 0,
};

/**
 * Adds the component of one point with the components of another
 * @param p1 the first addend
 * @param p2 the second added
 * @returns a new point with p2 added to p1
 */
export function addPoint(p1: Point, p2: Point) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y,
    };
}

/**
 * subtract a points components with the component of the second point
 * @param p1 the minuend point
 * @param p2 the subtrahend point
 * @returns a new point with p2 subtracted from p1
 */
export function subtractPoint(p1: Point, p2: Point) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y,
    };
}

/**
 * Translates and returns a new point with the amount applied to the x axis
 * @param point the point to translate
 * @param amount the amount to translate along the x axis
 * @returns a new point with the translation applied
 */
export function changeX(point: Point, amount: number) {
    return {
        x: point.x + amount,
        y: point.y,
    };
}

/**
 * Translates and returns a new point with the amount applied to the y axis
 * @param point the point to translate
 * @param amount the amount to translate along the y axis
 * @returns a new point with the translation applied
 */
export function changeY(point: Point, amount: number) {
    return {
        x: point.x,
        y: point.y + amount,
    };
}

/**
 * Inverts both the components of the point
 * @param point the point to invert
 * @returns a new instance of a point with the components flipped/inverted
 */
export function invert(point: Point): Point {
    return {
        x: point.x * -1,
        y: point.y * -1,
    };
}

export function multiplyPoint(point: Point, factor: number): Point {
    return {
        x: point.x * factor,
        y: point.y * factor,
    };
}

/**
 * Check if the two points are refering to the same point in space
 * @param point the first point
 * @param otherPoint the second point to check for equality against the first
 * @returns if the points represent the same coordinates
 */
export function pointEquals(point: Point, otherPoint: Point): boolean {
    return point.x == otherPoint.x && point.y == otherPoint.y;
}

/**
 * Measure the distance between two points
 * @param from the coordinate to measure from
 * @param to the coordinate to measure to
 * @returns the distance between the points
 */
export function distance(from: Point, to: Point): number {
    const xDiff = to.x - from.x;
    const yDiff = to.y - from.y;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

/**
 * Gets the coordinate of the point that is adjacent in the provided direction
 * @param point the point to create an adjacent coordinate from
 * @param direction the direction the of the adjacent coordinate
 * @returns the adjacent point
 */
export function adjacentPoint(point: Point, direction: Direction): Point {
    switch (direction) {
        case Direction.Left:
            return changeX(point, -1);
        case Direction.Right:
            return changeX(point, 1);
        case Direction.Down:
            return changeY(point, 1);
        case Direction.Up:
            return changeY(point, -1);
    }
}

/**
 * Checks if pointB is adjacent to PointA either on the top, left, right or bottom
 * @param pointA The main point
 * @param pointB The point to check if is adjacent to pointA
 * @returns true if the point is adjacent
 */
export function isPointAdjacentTo(pointA: Point, pointB: Point): boolean {
    if (pointEquals(adjacentPoint(pointA, Direction.Left), pointB)) {
        return true;
    }

    if (pointEquals(adjacentPoint(pointA, Direction.Up), pointB)) {
        return true;
    }

    if (pointEquals(adjacentPoint(pointA, Direction.Down), pointB)) {
        return true;
    }

    if (pointEquals(adjacentPoint(pointA, Direction.Right), pointB)) {
        return true;
    }

    // None of the adjacent directions matched point B
    return false;
}
