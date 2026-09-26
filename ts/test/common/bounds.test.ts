import { describe, it } from "node:test";
import assert from "node:assert";
import {
    type Bounds,
    boundsContains,
    boundsOverlap,
} from "../../src/common/bounds.ts";

describe("Bounds", () => {
    it("is bounds within another bounds", () => {
        const outer: Bounds = { x1: 2, y1: 3, x2: 12, y2: 13 };
        assert.strictEqual(
            boundsContains(outer, { x1: 4, y1: 5, x2: 9, y2: 10 }),
            true,
        );
        // Sharing every edge still counts as contained.
        assert.strictEqual(boundsContains(outer, outer), true);
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
});
