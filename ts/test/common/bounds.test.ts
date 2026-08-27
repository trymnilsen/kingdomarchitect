import { describe, it } from "node:test";
import assert from "node:assert";
import {
    type Bounds,
    absBounds,
    boundsContains,
    boundsOverlap,
    getBoundsAxis,
    getCorners,
    withinRectangle,
    zeroBounds,
} from "../../src/common/bounds.ts";
import { Axis } from "../../src/common/direction.ts";

describe("Bounds", () => {
    it("Is within rectangle", () => {
        const point = {
            x: 2,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.strictEqual(within, true);
    });

    it("top is outside rectangle", () => {
        const point = {
            x: 2,
            y: 0,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.strictEqual(within, false);
    });

    it("left is outside rectangle", () => {
        const point = {
            x: 0,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.strictEqual(within, false);
    });

    it("right is outside rectangle", () => {
        const point = {
            x: 6,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.strictEqual(within, false);
    });

    it("bottom is outside rectangle", () => {
        const point = {
            x: 2,
            y: 6,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.strictEqual(within, false);
    });

    it("zerobounds it not mutable", () => {
        const bounds = zeroBounds();
        const secondBounds = zeroBounds();
        secondBounds.x1 = 5;
        assert.strictEqual(bounds.x1, 0);
        assert.strictEqual(secondBounds.x1, 5);
    });

    it("gets range from axis", () => {
        const bounds: Bounds = {
            x1: 2,
            y1: 4,
            x2: 6,
            y2: 8,
        };
        const xAxisRange = getBoundsAxis(bounds, Axis.XAxis);
        const yAxisRange = getBoundsAxis(bounds, Axis.YAxis);
        assert.strictEqual(xAxisRange.min, 2);
        assert.strictEqual(xAxisRange.max, 6);
        assert.strictEqual(yAxisRange.min, 4);
        assert.strictEqual(yAxisRange.max, 8);
    });

    it("offsets bounds to absolute coordinates", () => {
        const bounds: Bounds = {
            x1: -5,
            y1: -8,
            x2: 10,
            y2: 8,
        };

        const abosluteBounds = absBounds(bounds);
        assert.deepStrictEqual(abosluteBounds.bounds, {
            x1: 0,
            y1: 0,
            x2: 15,
            y2: 16,
        });
        assert.deepStrictEqual(abosluteBounds.offsets, { x: 5, y: 8 });
        /*
        assert.deepEqual(abosluteBounds.bounds, {
            x1: 0,
            y1: 0,
            x2: 15,
            y2: 16,
        });
        assert.deepEqual(abosluteBounds.offsets, { x: 5, y: 8 });*/
    });

    it("is bounds within another bounds", () => {
        const outer: Bounds = { x1: 2, y1: 3, x2: 12, y2: 13 };
        assert.strictEqual(
            boundsContains(outer, { x1: 4, y1: 5, x2: 9, y2: 10 }),
            true,
        );
        // Sharing every edge still counts as contained.
        assert.strictEqual(boundsContains(outer, outer), true);
    });

    it("is bounds not within another bounds", () => {
        const outer: Bounds = { x1: 2, y1: 3, x2: 12, y2: 13 };
        assert.strictEqual(
            boundsContains(outer, { x1: 20, y1: 20, x2: 25, y2: 25 }),
            false,
        );
    });

    it("overlapping bounds are not considered within", () => {
        const outer: Bounds = { x1: 2, y1: 3, x2: 12, y2: 13 };
        const straddling: Bounds = { x1: 8, y1: 8, x2: 16, y2: 16 };
        assert.strictEqual(boundsOverlap(outer, straddling), true);
        assert.strictEqual(boundsContains(outer, straddling), false);
    });

    // Touching edges and corners count as overlapping: the edge coordinate
    // belongs to both bounds.
    const overlapCases: Array<{
        name: string;
        b1: Bounds;
        b2: Bounds;
        overlaps: boolean;
    }> = [
        {
            name: "one fully inside the other",
            b1: { x1: 0, y1: 0, x2: 10, y2: 10 },
            b2: { x1: 2, y1: 2, x2: 8, y2: 8 },
            overlaps: true,
        },
        {
            name: "corners overlapping",
            b1: { x1: 0, y1: 0, x2: 10, y2: 10 },
            b2: { x1: 8, y1: 8, x2: 12, y2: 12 },
            overlaps: true,
        },
        {
            name: "right edge touching left edge",
            b1: { x1: 0, y1: 0, x2: 10, y2: 10 },
            b2: { x1: 10, y1: 0, x2: 20, y2: 10 },
            overlaps: true,
        },
        {
            name: "left edge touching right edge",
            b1: { x1: 10, y1: 0, x2: 20, y2: 10 },
            b2: { x1: 0, y1: 0, x2: 10, y2: 10 },
            overlaps: true,
        },
        {
            name: "bottom edge touching top edge",
            b1: { x1: 0, y1: 0, x2: 10, y2: 10 },
            b2: { x1: 0, y1: 10, x2: 10, y2: 20 },
            overlaps: true,
        },
        {
            name: "top edge touching bottom edge",
            b1: { x1: 0, y1: 10, x2: 10, y2: 20 },
            b2: { x1: 0, y1: 0, x2: 10, y2: 10 },
            overlaps: true,
        },
        {
            name: "bottom right corner touching top left corner",
            b1: { x1: 0, y1: 0, x2: 10, y2: 10 },
            b2: { x1: 10, y1: 10, x2: 20, y2: 20 },
            overlaps: true,
        },
        {
            name: "top left corner touching bottom right corner",
            b1: { x1: 10, y1: 10, x2: 20, y2: 20 },
            b2: { x1: 0, y1: 0, x2: 10, y2: 10 },
            overlaps: true,
        },
        {
            name: "separated horizontally",
            b1: { x1: 0, y1: 0, x2: 10, y2: 10 },
            b2: { x1: 11, y1: 0, x2: 20, y2: 10 },
            overlaps: false,
        },
        {
            name: "separated vertically",
            b1: { x1: 0, y1: 0, x2: 10, y2: 10 },
            b2: { x1: 0, y1: 11, x2: 10, y2: 20 },
            overlaps: false,
        },
        {
            name: "separated diagonally",
            b1: { x1: 0, y1: 0, x2: 5, y2: 5 },
            b2: { x1: 6, y1: 6, x2: 10, y2: 10 },
            overlaps: false,
        },
    ];

    for (const testCase of overlapCases) {
        it(`overlaps: ${testCase.name}`, () => {
            assert.strictEqual(
                boundsOverlap(testCase.b1, testCase.b2),
                testCase.overlaps,
            );
        });
    }

    it("corners are returned clockwise from the top left", () => {
        const bounds: Bounds = { x1: 3, y1: 4, x2: 9, y2: 11 };

        assert.deepStrictEqual(getCorners(bounds), [
            { x: 3, y: 4 },
            { x: 9, y: 4 },
            { x: 9, y: 11 },
            { x: 3, y: 11 },
        ]);
    });
});
