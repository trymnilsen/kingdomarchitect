import { randomEntry } from "./array";

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
        directions = horizontalDirections;
    } else if (axis === Axis.YAxis) {
        directions = verticalDirections;
    } else {
        directions = [...verticalDirections, ...horizontalDirections];
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
    XAxis,
    YAxis,
}

const verticalDirections = [Direction.Up, Direction.Down];
const horizontalDirections = [Direction.Left, Direction.Right];
