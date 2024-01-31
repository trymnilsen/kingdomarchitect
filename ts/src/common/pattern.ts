import { Point, addPoint } from "./point.js";

export function adjacentPointsWithPattern(
    point: Point,
    pattern: Point[],
): Point[] {
    const points: Point[] = [];
    for (const patternPoint of pattern) {
        points.push(addPoint(patternPoint, point));
    }

    return points;
}

export const diamondPattern = [
    { x: 0, y: -2 },
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: -2, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 0, y: 2 },
];
