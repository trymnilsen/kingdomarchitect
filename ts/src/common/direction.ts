import { randomEntry } from "./array.js";

export enum Direction {
    Up = "up",
    Down = "down",
    Left = "left",
    Right = "right",
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

export function invertAxis(axis: Axis) {
    switch (axis) {
        case Axis.XAxis:
            return Axis.YAxis;
        case Axis.YAxis:
            return Axis.XAxis;
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

export function getRandomDirection(axis?: Axis): Direction {
    let directions: Direction[] = [];
    if (axis === Axis.XAxis) {
        directions = [...horizontalDirections];
    } else if (axis === Axis.YAxis) {
        directions = [...verticalDirections];
    } else {
        directions = [...allDirections];
    }
    return randomEntry(directions);
}

export function getRandomAxis(): Axis {
    const randomAxis = Math.floor(Math.random() * 2);
    if (randomAxis >= 1.0) {
        return Axis.YAxis;
    } else {
        return Axis.XAxis;
    }
}

export enum Axis {
    XAxis = "XAxis",
    YAxis = "YAxis",
}

export const verticalDirections: Readonly<Direction[]> = [
    Direction.Up,
    Direction.Down,
];
export const horizontalDirections: Readonly<Direction[]> = [
    Direction.Left,
    Direction.Right,
];
export const allDirections: Readonly<Direction[]> = [
    ...horizontalDirections,
    ...verticalDirections,
];

export enum OrdinalDirection {
    Northeast = "northeast",
    Southeast = "southeast",
    Southwest = "southwest",
    Northwest = "northwest",
}

export function invertOrdinalDirection(direction: OrdinalDirection) {
    switch (direction) {
        case OrdinalDirection.Northeast:
            return OrdinalDirection.Southwest;
        case OrdinalDirection.Southwest:
            return OrdinalDirection.Northeast;
        case OrdinalDirection.Northwest:
            return OrdinalDirection.Southeast;
        case OrdinalDirection.Southeast:
            return OrdinalDirection.Northwest;
    }
}

export function getOrdinalDirection(
    vertical: Direction.Up | Direction.Down,
    horizontal: Direction.Left | Direction.Right,
): OrdinalDirection {
    if (vertical === Direction.Up) {
        return horizontal === Direction.Right
            ? OrdinalDirection.Northeast
            : OrdinalDirection.Northwest;
    } else {
        return horizontal === Direction.Right
            ? OrdinalDirection.Southeast
            : OrdinalDirection.Southwest;
    }
}

export function getRandomOrdinalDirection(): OrdinalDirection {
    return randomEntry([...allOrdinalDirections]);
}

export const allOrdinalDirections: Readonly<OrdinalDirection[]> = [
    OrdinalDirection.Northeast,
    OrdinalDirection.Southeast,
    OrdinalDirection.Southwest,
    OrdinalDirection.Northwest,
];
