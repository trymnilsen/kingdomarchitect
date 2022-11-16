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
