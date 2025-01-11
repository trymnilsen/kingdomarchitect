import { Direction } from "./direction.js";

/**
 * A point represents a pair of numbers used to represent a point in space
 * The point does not take into account the type of space. It can be both
 * in screenspace, worldspace or "tile space".
 */
export type Point = {
    x: number;
    y: number;
};

/**
 * A point with both components set to zero
 */
export function zeroPoint(): Point {
    return {
        x: 0,
        y: 0,
    };
}

export function floorPoint(point: Point): Point {
    return {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
    };
}

export function pointGrid(width: number, height: number): Point[] {
    const points: Point[] = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            points.push({ x, y });
        }
    }

    return points;
}

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

export function shiftPoint(point: Point, direction: Direction, amount: number) {
    switch (direction) {
        case Direction.Down:
            return changeY(point, amount);
        case Direction.Up:
            return changeY(point, amount * -1);
        case Direction.Left:
            return changeX(point, amount * -1);
        case Direction.Right:
            return changeX(point, amount);
    }
}

/**
 * Inverts both the components of the point to negative or positive
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
    return Math.sqrt(distanceSquared(from, to));
}

/**
 * Measure the distance between two points squared
 * @param from the coordinate to measure from
 * @param to the coordinate to measure to
 * @returns the distance squared
 */
export function distanceSquared(from: Point, to: Point): number {
    const xDiff = to.x - from.x;
    const yDiff = to.y - from.y;
    return xDiff * xDiff + yDiff * yDiff;
}
export function manhattanPath(from: Point, to: Point): Point[] {
    if (pointEquals(from, to)) {
        return [];
    }

    const xRange = to.x - from.x;
    const yRange = to.y - from.y;
    const positions: Point[] = [];

    // 1 is subtracted from the range to avoid pushing a duplicate
    // position where the horizontal line (made here) and the
    // vertical lines meet
    for (let x = 0; x < Math.abs(xRange); x++) {
        let direction = 1;
        if (xRange < 0) {
            direction = -1;
        }

        const xPosition = from.x + x * direction;
        positions.push({
            x: xPosition,
            y: from.y,
        });
    }

    for (let y = 0; y < Math.abs(yRange); y++) {
        let direction = 1;
        if (yRange < 0) {
            direction = -1;
        }

        const yPosition = from.y + y * direction;
        positions.push({
            x: to.x,
            y: yPosition,
        });
    }

    positions.push(to);

    //Filter out duplicates
    const filteredPositions = positions.filter(
        (value, index, self) =>
            index === self.findIndex((t) => t.x === value.x && t.y === value.y),
    );

    return filteredPositions;
}

export function manhattanDistance(from: Point, to: Point): number {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}

/**
 * Measures the distance between to points using the manhattan algorithm.
 * (Adding the x and y components) and multiplies a weight to each component
 * @param from the point to measure from
 * @param to the point to measure to
 * @param xWeight the factor to multiply the x component with
 * @param yWeight the factor to multiply the y component with
 */
export function weightedManhattanDistance(
    from: Point,
    to: Point,
    xWeight: number,
    yWeight: number,
): number {
    const xDistance = Math.abs(to.x - from.x);
    const yDistance = Math.abs(to.y - from.y);
    return xDistance * xWeight + yDistance * yWeight;
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

export function adjacentPoints(point: Point, includeDiagonal = false): Point[] {
    const points: Point[] = [];
    points.push(adjacentPoint(point, Direction.Left));
    points.push(adjacentPoint(point, Direction.Right));
    points.push(adjacentPoint(point, Direction.Up));
    points.push(adjacentPoint(point, Direction.Down));

    if (includeDiagonal) {
        //Upper left
        points.push(addPoint(point, { x: -1, y: -1 }));
        //Upper right
        points.push(addPoint(point, { x: 1, y: -1 }));
        //bottom left
        points.push(addPoint(point, { x: -1, y: 1 }));
        //bottom right
        points.push(addPoint(point, { x: 1, y: 1 }));
    }

    return points;
}

/**
 * Checks if pointB is adjacent to PointA on the top, left, right or bottom
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

/**
 * Get the closest direction between the two points
 * @param a
 * @param b
 * @returns
 */
export function getDirection(a: Point, b: Point): Direction | null {
    if (pointEquals(a, b)) {
        return null;
    }

    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    // an angle of 0 is along the x axis growing ->
    // goes from -180 to 180
    // other angles for reference
    // ^ -90
    // <- 180
    // v 90
    // (upper left) - 135
    let direction = Direction.Up;
    if (angle < -135 || angle > 135) {
        direction = Direction.Left;
    } else if (angle > -45 && angle < 45) {
        direction = Direction.Right;
    } else if (angle >= 45 && angle < 135) {
        direction = Direction.Down;
    }
    return direction;
}

export function getSizeOfPoints(points: Point[]): Point {
    let lowestX = Number.MAX_SAFE_INTEGER;
    let lowestY = Number.MAX_SAFE_INTEGER;
    let highestX = Number.MIN_SAFE_INTEGER;
    let highestY = Number.MIN_SAFE_INTEGER;

    for (const point of points) {
        if (point.x < lowestX) {
            lowestX = point.x;
        }
        if (point.y < lowestY) {
            lowestY = point.y;
        }
        if (point.x > highestX) {
            highestX = point.x;
        }
        if (point.y > highestY) {
            highestY = point.y;
        }
    }

    return {
        x: highestX - lowestX + 1,
        y: highestY - lowestY + 1,
    };
}

/**
 * Calculates the dot product of the to points as vectors
 * @param a the first component of the dot product
 * @param b the second component of the dot product
 * @returns the dot product scalar
 */
export function dotProduct(a: Point, b: Point): number {
    return a.x * b.x + a.y * b.y;
}

/**
 * Find the point on a line presented by A and B points that is closest to
 * a given point P
 * @param a the start of the line segment
 * @param b the end of the line segment
 * @param p the point we want to find the closest point on the line to
 */
export function closestPointOnLine(a: Point, b: Point, p: Point): Point {
    const abVector = subtractPoint(b, a);
    const apVector = subtractPoint(p, a);
    const projection = dotProduct(apVector, abVector);
    const abDistanceSquared = distanceSquared({ x: 0, y: 0 }, abVector);
    if (abDistanceSquared == 0) {
        return a;
    }
    const t = projection / abDistanceSquared;
    //If t is outside the range of 0-1 the closest point should be the end
    //of our line
    if (t <= 0) {
        return a;
    } else if (t >= 1) {
        return b;
    } else {
        //The closest point was somewhere on our line so we start at a
        //and add the amout of ab (as it is the whole line between a and b)
        //and multiply it with t
        return addPoint(a, multiplyPoint(abVector, t));
    }
}

export function isPoint(value: unknown): value is Point {
    if (!value) {
        return false;
    }

    if (typeof value != "object") {
        return false;
    }

    return "x" in value && "y" in value;
}

export function encodePosition(x: number, y: number): number {
    return ((x & 0xffff) << 16) | (y & 0xffff);
}

export function decodePosition(encoded: number): Point {
    const x = (encoded >> 16) & 0xffff; // Extract the upper 16 bits and mask them to 16 bits
    const y = encoded & 0xffff; // Extract the lower 16 bits
    return { x, y };
}
