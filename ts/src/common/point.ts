import { Direction } from "./direction";

export interface Point {
    x: number;
    y: number;
}

export const zeroPoint: { readonly x: 0; readonly y: 0 } = {
    x: 0,
    y: 0,
};

export function addPoint(p1: Point, p2: Point) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y,
    };
}

export function subtractPoint(p1: Point, p2: Point) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y,
    };
}

export function changeX(point: Point, amount: number) {
    return {
        x: point.x + amount,
        y: point.y,
    };
}

export function changeY(point: Point, amount: number) {
    return {
        x: point.x,
        y: point.y + amount,
    };
}

export function inverte(point: Point): Point {
    return {
        x: point.x * -1,
        y: point.y * -1,
    };
}

export function distance(from: Point, to: Point): number {
    const xDiff = to.x - from.x;
    const yDiff = to.y - from.y;
    return Math.sqrt(xDiff * xDiff + yDiff + yDiff);
}

export function adjacentPoint(point: Point, direction: Direction) {
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
