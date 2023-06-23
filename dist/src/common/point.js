import { Direction } from "./direction.js";
/**
 * A point with both components set to zero
 */ export function zeroPoint() {
    return {
        x: 0,
        y: 0
    };
}
/**
 * Adds the component of one point with the components of another
 * @param p1 the first addend
 * @param p2 the second added
 * @returns a new point with p2 added to p1
 */ export function addPoint(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}
/**
 * subtract a points components with the component of the second point
 * @param p1 the minuend point
 * @param p2 the subtrahend point
 * @returns a new point with p2 subtracted from p1
 */ export function subtractPoint(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    };
}
/**
 * Translates and returns a new point with the amount applied to the x axis
 * @param point the point to translate
 * @param amount the amount to translate along the x axis
 * @returns a new point with the translation applied
 */ export function changeX(point, amount) {
    return {
        x: point.x + amount,
        y: point.y
    };
}
/**
 * Translates and returns a new point with the amount applied to the y axis
 * @param point the point to translate
 * @param amount the amount to translate along the y axis
 * @returns a new point with the translation applied
 */ export function changeY(point, amount) {
    return {
        x: point.x,
        y: point.y + amount
    };
}
/**
 * Inverts both the components of the point to negative or positive
 * @param point the point to invert
 * @returns a new instance of a point with the components flipped/inverted
 */ export function invert(point) {
    return {
        x: point.x * -1,
        y: point.y * -1
    };
}
export function multiplyPoint(point, factor) {
    return {
        x: point.x * factor,
        y: point.y * factor
    };
}
/**
 * Check if the two points are refering to the same point in space
 * @param point the first point
 * @param otherPoint the second point to check for equality against the first
 * @returns if the points represent the same coordinates
 */ export function pointEquals(point, otherPoint) {
    return point.x == otherPoint.x && point.y == otherPoint.y;
}
/**
 * Measure the distance between two points
 * @param from the coordinate to measure from
 * @param to the coordinate to measure to
 * @returns the distance between the points
 */ export function distance(from, to) {
    return Math.sqrt(distanceSquared(from, to));
}
/**
 * Measure the distance between two points squared
 * @param from the coordinate to measure from
 * @param to the coordinate to measure to
 * @returns the distance squared
 */ export function distanceSquared(from, to) {
    const xDiff = to.x - from.x;
    const yDiff = to.y - from.y;
    return xDiff * xDiff + yDiff * yDiff;
}
export function manhattanDistance(from, to) {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}
/**
 * Measures the distance between to points using the manhattan algorithm.
 * (Adding the x and y components) and multiplies a weight to each component
 * @param from the point to measure from
 * @param to the point to measure to
 * @param xWeight the factor to multiply the x component with
 * @param yWeight the factor to multiply the y component with
 */ export function weightedManhattanDistance(from, to, xWeight, yWeight) {
    const xDistance = Math.abs(to.x - from.x);
    const yDistance = Math.abs(to.y - from.y);
    return xDistance * xWeight + yDistance * yWeight;
}
/**
 * Gets the coordinate of the point that is adjacent in the provided direction
 * @param point the point to create an adjacent coordinate from
 * @param direction the direction the of the adjacent coordinate
 * @returns the adjacent point
 */ export function adjacentPoint(point, direction) {
    switch(direction){
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
export function adjacentPoints(point, includeDiagonal = false) {
    const points = [];
    points.push(adjacentPoint(point, Direction.Left));
    points.push(adjacentPoint(point, Direction.Right));
    points.push(adjacentPoint(point, Direction.Up));
    points.push(adjacentPoint(point, Direction.Down));
    if (includeDiagonal) {
        //Upper left
        points.push(addPoint(point, {
            x: -1,
            y: -1
        }));
        //Upper right
        points.push(addPoint(point, {
            x: 1,
            y: -1
        }));
        //bottom left
        points.push(addPoint(point, {
            x: -1,
            y: 1
        }));
        //bottom right
        points.push(addPoint(point, {
            x: 1,
            y: 1
        }));
    }
    return points;
}
/**
 * Checks if pointB is adjacent to PointA on the top, left, right or bottom
 * @param pointA The main point
 * @param pointB The point to check if is adjacent to pointA
 * @returns true if the point is adjacent
 */ export function isPointAdjacentTo(pointA, pointB) {
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
 */ export function getDirection(a, b) {
    if (pointEquals(a, b)) {
        return null;
    }
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
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
export function getSizeOfPoints(points) {
    let lowestX = Number.MAX_SAFE_INTEGER;
    let lowestY = Number.MAX_SAFE_INTEGER;
    let highestX = Number.MIN_SAFE_INTEGER;
    let highestY = Number.MIN_SAFE_INTEGER;
    for (const point of points){
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
        y: highestY - lowestY + 1
    };
}
/**
 * Calculates the dot product of the to points as vectors
 * @param a the first component of the dot product
 * @param b the second component of the dot product
 * @returns the dot product scalar
 */ export function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y;
}
/**
 * Find the point on a line presented by A and B points that is closest to
 * a given point P
 * @param a the start of the line segment
 * @param b the end of the line segment
 * @param p the point we want to find the closest point on the line to
 */ export function closestPointOnLine(a, b, p) {
    const abVector = subtractPoint(b, a);
    const apVector = subtractPoint(p, a);
    const projection = dotProduct(apVector, abVector);
    const abDistanceSquared = distanceSquared({
        x: 0,
        y: 0
    }, abVector);
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
