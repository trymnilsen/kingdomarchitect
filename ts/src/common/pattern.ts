import { type Point, addPoint } from "./point.ts";

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

/**
 * Builds the diamond of tile offsets reachable within `radius` tiles (Manhattan),
 * centred on the origin. This is the radius-first wrapper over
 * {@link generateDiamondPattern}, which takes a diameter; expressing it as a
 * radius keeps callers in the same units as vision-reach values.
 *
 * Kept as its own named function (no memoization) so that if pattern generation
 * ever shows up in a profile it is a single, obvious line to optimise.
 *
 * @param radius the Manhattan reach in tiles (0 yields just the centre tile)
 */
export function diamondPatternForRadius(radius: number): Point[] {
    return generateDiamondPattern(radius * 2 + 1);
}

/**
 * Builds a filled disc of tile offsets within `radius` tiles by straight-line
 * (Euclidean) distance, centred on the origin: every offset where
 * `dx*dx + dy*dy <= radius*radius`.
 *
 * This is deliberately a disc, not a {@link generateDiamondPattern} diamond,
 * because it is used to represent a light source's footprint and must equal the
 * set of tiles that source illuminates. Illumination tests `distSq <= radiusSq`
 * (see `bandFromEmitters`), so a disc of the same radius covers exactly the lit
 * tiles — a Manhattan diamond would miss the lit tiles near the diagonals.
 *
 * @param radius the Euclidean reach in tiles (0 yields just the centre tile)
 */
export function generateDiscPattern(radius: number): Point[] {
    const points: Point[] = [];
    const bound = Math.floor(radius);
    const radiusSq = radius * radius;
    for (let y = -bound; y <= bound; y++) {
        for (let x = -bound; x <= bound; x++) {
            if (x * x + y * y <= radiusSq) {
                points.push({ x, y });
            }
        }
    }
    return points;
}

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
