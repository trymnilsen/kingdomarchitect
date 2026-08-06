import { describe, it } from "node:test";
import assert from "node:assert";
import {
    adjacentPoints,
    pointEquals,
    type Point,
} from "../../src/common/point.ts";
import {
    chunkKey,
    generateBiomeShape,
    type BiomeShapeParams,
} from "../../src/devtools/mountainpreview/biomeShapeSearch.ts";

function baseParams(overrides: Partial<BiomeShapeParams>): BiomeShapeParams {
    return {
        start: { x: 12, y: 8 },
        blocked: new Set(),
        targetSize: 7,
        seed: 1,
        metric: "euclidean",
        anisotropy: 1,
        orientation: "horizontal",
        noiseAmplitude: 0,
        noiseFrequency: 0.25,
        wells: [],
        encompassBias: 0,
        wallOffset: 0,
        ...overrides,
    };
}

function centroidX(chunks: Point[]): number {
    return chunks.reduce((sum, c) => sum + c.x, 0) / chunks.length;
}

function keysOf(chunks: Point[]): Set<string> {
    return new Set(chunks.map(chunkKey));
}

function boundingBox(chunks: Point[]): { width: number; height: number } {
    const xs = chunks.map((c) => c.x);
    const ys = chunks.map((c) => c.y);
    return {
        width: Math.max(...xs) - Math.min(...xs) + 1,
        height: Math.max(...ys) - Math.min(...ys) + 1,
    };
}

describe("generateBiomeShape", () => {
    it("collects exactly targetSize unique chunks on an open grid", () => {
        const result = generateBiomeShape(baseParams({ targetSize: 12 }));

        assert.equal(result.length, 12, "should stop at the target size");
        assert.ok(
            pointEquals(result[0], { x: 12, y: 8 }),
            "the start chunk should be first",
        );
        assert.equal(keysOf(result).size, 12, "every chunk should be unique");
    });

    it("always produces a continuous (connected) region", () => {
        const result = generateBiomeShape(
            baseParams({ targetSize: 40, noiseAmplitude: 6 }),
        );
        const present = keysOf(result);

        for (let i = 1; i < result.length; i++) {
            const hasNeighbour = adjacentPoints(result[i]).some((neighbour) =>
                present.has(chunkKey(neighbour)),
            );
            assert.ok(
                hasNeighbour,
                `chunk ${chunkKey(result[i])} should touch the region`,
            );
        }
    });

    it("is deterministic per seed and varies when the seed changes", () => {
        const params = baseParams({ targetSize: 30, noiseAmplitude: 6 });
        const first = generateBiomeShape(params);
        const same = generateBiomeShape(params);
        const different = generateBiomeShape({ ...params, seed: 999 });

        assert.deepEqual(
            first.map(chunkKey),
            same.map(chunkKey),
            "same seed should reproduce the same shape",
        );
        assert.notDeepEqual(
            first.map(chunkKey),
            different.map(chunkKey),
            "a different seed should change the shape",
        );
    });

    it("never enters a blocked chunk and stops when walled in", () => {
        const start = { x: 12, y: 8 };
        const blocked = new Set([
            chunkKey({ x: 11, y: 8 }),
            chunkKey({ x: 13, y: 8 }),
            chunkKey({ x: 12, y: 7 }),
            chunkKey({ x: 12, y: 9 }),
        ]);

        const result = generateBiomeShape(
            baseParams({ start, blocked, targetSize: 10 }),
        );

        assert.equal(result.length, 1, "fill cannot escape the ring");
        for (const blockedKey of blocked) {
            assert.ok(!keysOf(result).has(blockedKey));
        }
    });

    it("elongates along the oriented axis when anisotropy is high", () => {
        const horizontal = generateBiomeShape(
            baseParams({
                targetSize: 40,
                anisotropy: 4,
                orientation: "horizontal",
            }),
        );
        const vertical = generateBiomeShape(
            baseParams({
                targetSize: 40,
                anisotropy: 4,
                orientation: "vertical",
            }),
        );

        const horizontalBox = boundingBox(horizontal);
        const verticalBox = boundingBox(vertical);

        assert.ok(
            horizontalBox.width > horizontalBox.height,
            "horizontal anisotropy should be wider than tall",
        );
        assert.ok(
            verticalBox.height > verticalBox.width,
            "vertical anisotropy should be taller than wide",
        );
    });

    it("grows into open space instead of wrapping blockers when biased", () => {
        // Start sits just left of a vertical wall, with open space to the left.
        // The chunk directly behind the wall is close in a straight line but only
        // reachable by a long detour around the wall's ends.
        const start = { x: 12, y: 8 };
        const blocked = new Set(
            [6, 7, 8, 9, 10].map((y) => chunkKey({ x: 13, y })),
        );
        const behindWall = chunkKey({ x: 14, y: 8 });
        // Large enough that the unbiased fill grows around the wall and reaches
        // the far side, but far smaller than the open space the biased fill has.
        const params = { start, blocked, targetSize: 60 };

        const unbiased = generateBiomeShape(
            baseParams({ ...params, encompassBias: 0 }),
        );
        const biased = generateBiomeShape(
            baseParams({ ...params, encompassBias: 5 }),
        );

        assert.ok(
            keysOf(unbiased).has(behindWall),
            "without bias the fill wraps around to the chunk behind the wall",
        );
        assert.ok(
            !keysOf(biased).has(behindWall),
            "with bias the fill stays in open space and skips the wrapped chunk",
        );
    });

    it("shifts the body away from a wall when wallOffset is applied", () => {
        // A wall one column to the right of the start. The open normal points
        // left, so a positive wallOffset should pull the body's centre of mass
        // further left than with no offset.
        const start = { x: 12, y: 8 };
        const blocked = new Set(
            [6, 7, 8, 9, 10].map((y) => chunkKey({ x: 13, y })),
        );
        const params = { start, blocked, targetSize: 30 };

        const centered = generateBiomeShape(
            baseParams({ ...params, wallOffset: 0 }),
        );
        const shifted = generateBiomeShape(
            baseParams({ ...params, wallOffset: 0.8 }),
        );

        assert.ok(
            centroidX(shifted) < centroidX(centered),
            "wallOffset should move the body away from the wall",
        );
        assert.ok(
            shifted.some((c) => pointEquals(c, start)),
            "the start is still part of the biome",
        );
    });

    it("leaves open-space shapes unchanged when nothing is blocked", () => {
        // No blockers near the start -> no open normal -> offset is a no-op,
        // so the result must be identical regardless of wallOffset.
        const params = { start: { x: 12, y: 8 }, targetSize: 24 };
        const withoutOffset = generateBiomeShape(
            baseParams({ ...params, wallOffset: 0 }),
        );
        const withOffset = generateBiomeShape(
            baseParams({ ...params, wallOffset: 1.2 }),
        );

        assert.deepEqual(withOffset.map(chunkKey), withoutOffset.map(chunkKey));
    });

    it("ignores a well that lands on a blocked chunk", () => {
        const start = { x: 12, y: 8 };
        const well = { x: 17, y: 8 };
        const blocked = new Set([chunkKey(well)]);
        const params = { start, blocked, targetSize: 20 };

        const withBlockedWell = generateBiomeShape(
            baseParams({ ...params, wells: [well] }),
        );
        const withoutWell = generateBiomeShape(
            baseParams({ ...params, wells: [] }),
        );

        assert.deepEqual(
            withBlockedWell.map(chunkKey),
            withoutWell.map(chunkKey),
            "a blocked well should not pull the shape at all",
        );
    });

    it("returns nothing when the start chunk itself is blocked", () => {
        const start = { x: 12, y: 8 };
        const blocked = new Set([chunkKey(start)]);

        const result = generateBiomeShape(
            baseParams({ start, blocked, targetSize: 5 }),
        );

        assert.deepEqual(result, []);
    });
});
