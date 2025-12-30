import { Point, addPoint } from "./point.ts";

export function offsetPatternWithPoint(
    point: Point,
    pattern: ReadonlyArray<Point>,
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

export const largeDiamondPattern: Point[] = generateDiamondPattern(5);

export function generateDiamondPattern(size: number): Point[] {
    // Ensure size is an odd number for proper diamond shape
    if (size % 2 === 0) {
        size++;
    }

    const points: Point[] = [];
    const center = Math.floor(size / 2);

    // Generate the points, iterating through rows and columns
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Calculate distance from the center (using Manhattan distance)
            const distanceFromCenter =
                Math.abs(center - x) + Math.abs(center - y);

            // If the point is within the diamond radius, add it
            if (distanceFromCenter <= center) {
                points.push({ x: x - center, y: y - center });
            }
        }
    }

    return points;
}
