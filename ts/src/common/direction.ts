import { Point, pointEquals } from "./point";

export enum Direction {
    Up,
    Down,
    Left,
    Right,
}

export function invertDirection(direction: Direction) {
    switch (direction) {
        case Direction.Down:
            return Direction.Up;
        case Direction.Up:
            return Direction.Down;
        case Direction.Left:
            return Direction.Right;
        case Direction.Right:
            return Direction.Left;
    }
}

export function getAxis(direction: Direction) {
    switch (direction) {
        case Direction.Down:
        case Direction.Up:
            return Axis.YAxis;
        case Direction.Left:
        case Direction.Right:
            return Axis.XAxis;
    }
}

export enum Axis {
    XAxis,
    YAxis,
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
