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
