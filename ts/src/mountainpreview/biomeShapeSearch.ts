import { adjacentPoints, manhattanDistance } from "../common/point.ts";
import type { Point } from "../common/point.ts";
import { fbmNoise2d } from "../common/noise.ts";

/** Base distance metric that gives the biome its underlying silhouette. */
export type ShapeMetric = "euclidean" | "chebyshev" | "manhattan";

/** Axis the biome stretches along when anisotropy is above one. */
export type ShapeOrientation = "horizontal" | "vertical";

/**
 * Parameters for growing a biome shape. These are deliberately simple,
 * self-contained types: the search works purely in abstract chunk coordinates
 * so it can be modelled and tested in isolation from world generation.
 */
export type BiomeShapeParams = {
    /** The initial chunk the biome grows out from, in chunk coordinates. */
    start: Point;
    /** Chunk keys (see {@link chunkKey}) the search may not expand into. */
    blocked: ReadonlySet<string>;
    /** The desired number of chunks the biome should contain. */
    targetSize: number;
    /** Seed for the noise field, so a shape is reproducible. */
    seed: number;
    /** euclidean = round, chebyshev = square, manhattan = diamond. */
    metric: ShapeMetric;
    /** 1 = isotropic; greater values stretch the shape along `orientation`. */
    anisotropy: number;
    /** Axis the anisotropy stretches along. */
    orientation: ShapeOrientation;
    /** 0 = pure metric (smooth); higher = more ragged, organic edges. */
    noiseAmplitude: number;
    /** Spatial scale of the noise; smaller = broader, smoother lobes. */
    noiseFrequency: number;
    /** Extra attractor points besides `start` (e.g. peanut = one offset well). */
    wells: Point[];
    /**
     * How strongly to avoid growing around blocked chunks. 0 = ignore (a chunk
     * behind a blocker is as cheap as one in the open, so the biome may wrap
     * around and swallow the blocker); higher values push growth outward into
     * open space and only wrap when no cheaper space is left.
     */
    encompassBias: number;
    /**
     * Shifts the silhouette's centre off the start, away from nearby blocked
     * chunks, as a fraction of the biome radius. 0 keeps the start at the centre;
     * higher values push the body into open space so a start hard against a wall
     * ends up nearer the edge of its biome instead of the middle. Has no effect
     * when the start has no blocked chunks nearby (open-space shapes unchanged).
     */
    wallOffset: number;
};

// Noise detail level is fixed here; the presets vary amplitude and frequency,
// not the number of octaves, so these stay module constants rather than params.
const NOISE_OCTAVES = 3;
const NOISE_PERSISTENCE = 0.5;

/**
 * Stable string key for a chunk coordinate, used for membership in the blocked
 * and visited sets.
 */
export function chunkKey(point: Point): string {
    return `${point.x},${point.y}`;
}

/** Inverse of {@link chunkKey}: parses a "x,y" key back into a Point. */
export function parseChunkKey(key: string): Point {
    const [x, y] = key.split(",");
    return { x: Number(x), y: Number(y) };
}

/**
 * Grows a biome shape outward from the start chunk and returns its chunks,
 * start first. The result is always continuous (every chunk is cardinally
 * adjacent to another) and never enters a blocked chunk.
 *
 * Rather than a uniform flood fill (which always yields a diamond), this grows
 * the frontier chunk with the lowest cost first. The cost field shapes the
 * result: a distance metric sets the underlying silhouette, anisotropy stretches
 * it along an axis, extra attractor wells create lobes, a noise term roughens
 * the boundary, a detour penalty (see `encompassBias`) keeps it from wrapping
 * around blocked chunks, and the silhouette centre is shifted off the start away
 * from nearby blockers (see `wallOffset`) so a walled-in start sits off-centre.
 * Continuity is inherent because a chunk only ever enters the frontier as a
 * neighbour of one already accepted.
 */
export function generateBiomeShape(params: BiomeShapeParams): Point[] {
    if (params.targetSize < 1) {
        return [];
    }
    if (params.blocked.has(chunkKey(params.start))) {
        return [];
    }

    // A well buried in blocked terrain can't anchor a lobe (growth can't reach
    // it without a long detour), so drop it rather than let it drag a thin tail
    // toward unreachable space.
    const wells = params.wells.filter(
        (well) => !params.blocked.has(chunkKey(well)),
    );
    // Anchor the silhouette at a centre shifted off the start, into open space.
    // The start is still the growth seed; only the distance field's origin moves.
    const center = offsetCenter(params);
    const attractors = [center, ...wells];
    const result: Point[] = [];
    const visited = new Set<string>([chunkKey(params.start)]);
    const frontier: FrontierEntry[] = [
        {
            point: params.start,
            g: 0,
            score: scoreOf(params.start, 0, attractors, params),
        },
    ];

    while (frontier.length > 0 && result.length < params.targetSize) {
        const current = takeLowestScore(frontier);
        result.push(current.point);

        for (const neighbour of adjacentPoints(current.point)) {
            const key = chunkKey(neighbour);
            if (visited.has(key) || params.blocked.has(key)) {
                continue;
            }
            // Mark visited the first time the chunk is queued so it can never be
            // queued twice; the path that reaches it first sets its `g`.
            visited.add(key);
            const g = current.g + 1;
            frontier.push({
                point: neighbour,
                g,
                score: scoreOf(neighbour, g, attractors, params),
            });
        }
    }

    return result;
}

// How far out to sample blocked chunks when estimating the open normal. Beyond a
// few chunks a blocker no longer says much about which way the start should lean.
const NORMAL_SAMPLE_RADIUS = 3;

/**
 * The point the silhouette's distance field is measured from: the start, shifted
 * away from nearby blocked chunks by `wallOffset` of the biome radius. Blockers
 * near the start sum into an outward "normal" (closer ones weighted more); the
 * start is pushed along it. With no blockers near, the normal is zero and the
 * centre stays on the start, leaving open-space shapes untouched. The shift is a
 * fraction of the radius so the start stays inside the body rather than landing
 * beyond its edge (which would grow a thin neck).
 */
function offsetCenter(params: BiomeShapeParams): Point {
    if (params.wallOffset === 0) {
        return params.start;
    }

    let nx = 0;
    let ny = 0;
    for (let dy = -NORMAL_SAMPLE_RADIUS; dy <= NORMAL_SAMPLE_RADIUS; dy++) {
        for (let dx = -NORMAL_SAMPLE_RADIUS; dx <= NORMAL_SAMPLE_RADIUS; dx++) {
            if (dx === 0 && dy === 0) {
                continue;
            }
            const neighbour = { x: params.start.x + dx, y: params.start.y + dy };
            if (!params.blocked.has(chunkKey(neighbour))) {
                continue;
            }
            // Push away from the blocker, weighted by inverse-square distance so
            // close blockers dominate the direction.
            const distanceSquared = dx * dx + dy * dy;
            nx += -dx / distanceSquared;
            ny += -dy / distanceSquared;
        }
    }

    const magnitude = Math.sqrt(nx * nx + ny * ny);
    if (magnitude === 0) {
        return params.start;
    }

    const radius = Math.sqrt(params.targetSize / Math.PI);
    const shift = params.wallOffset * radius;
    return {
        x: params.start.x + (nx / magnitude) * shift,
        y: params.start.y + (ny / magnitude) * shift,
    };
}

type FrontierEntry = {
    point: Point;
    /**
     * Steps from the start along the growth tree. An upper bound on the true
     * shortest path (the growth order is not strictly by `g`), which is accurate
     * enough for the soft detour penalty in {@link scoreOf}.
     */
    g: number;
    score: number;
};

/**
 * Removes and returns the lowest-scoring frontier entry. A linear scan is used
 * deliberately: biome sizes are small (a few hundred chunks at most), so the
 * clarity outweighs a heap. Ties keep the earliest-inserted entry, which keeps
 * the output deterministic.
 */
function takeLowestScore(frontier: FrontierEntry[]): FrontierEntry {
    let bestIndex = 0;
    for (let i = 1; i < frontier.length; i++) {
        if (frontier[i].score < frontier[bestIndex].score) {
            bestIndex = i;
        }
    }
    const [entry] = frontier.splice(bestIndex, 1);
    return entry;
}

/**
 * Cost used to order growth: lower scores are grown first. Combines the
 * positional silhouette cost, a noise perturbation of the boundary, and a detour
 * penalty. The detour is how much longer the real path to the chunk (`g`) is than
 * the obstacle-free straight line; it is ~0 in open space (so silhouettes are
 * unchanged) but large for chunks only reachable by wrapping around a blocker,
 * which is what biases growth outward instead of around obstacles.
 */
function scoreOf(
    chunk: Point,
    g: number,
    attractors: Point[],
    params: BiomeShapeParams,
): number {
    const noise = fbmNoise2d(
        chunk.x * params.noiseFrequency,
        chunk.y * params.noiseFrequency,
        params.seed,
        NOISE_OCTAVES,
        NOISE_PERSISTENCE,
    );
    const detour = Math.max(0, g - manhattanDistance(params.start, chunk));
    return (
        baseCost(chunk, attractors, params) +
        noise * params.noiseAmplitude +
        detour * params.encompassBias
    );
}

/**
 * Cost from the nearest attractor under the chosen metric. The delta on the
 * orientation axis is shrunk by `anisotropy` before the metric is applied, so
 * that axis is cheaper to grow along and the shape elongates there.
 */
function baseCost(
    chunk: Point,
    attractors: Point[],
    params: BiomeShapeParams,
): number {
    let lowest = Infinity;
    for (const attractor of attractors) {
        let dx = chunk.x - attractor.x;
        let dy = chunk.y - attractor.y;
        if (params.orientation === "horizontal") {
            dx /= params.anisotropy;
        } else {
            dy /= params.anisotropy;
        }
        const cost = metricDistance(dx, dy, params.metric);
        if (cost < lowest) {
            lowest = cost;
        }
    }
    return lowest;
}

function metricDistance(dx: number, dy: number, metric: ShapeMetric): number {
    switch (metric) {
        case "euclidean":
            return Math.sqrt(dx * dx + dy * dy);
        case "manhattan":
            return Math.abs(dx) + Math.abs(dy);
        case "chebyshev":
            return Math.max(Math.abs(dx), Math.abs(dy));
    }
}
