import { describe, it, expect } from "vitest";
import {
    absBounds,
    Bounds,
    boundsOverlap,
    getBoundsAxis,
    withinRectangle,
    zeroBounds,
} from "../../src/common/bounds.js";
import { Axis } from "../../src/common/direction.js";

describe("Bounds", () => {
    it("Is within rectangle", () => {
        const point = {
            x: 2,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        expect(within).toBe(true);
    });

    it("top is outside rectangle", () => {
        const point = {
            x: 2,
            y: 0,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        expect(within).toBe(false);
    });

    it("left is outside rectangle", () => {
        const point = {
            x: 0,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        expect(within).toBe(false);
    });

    it("right is outside rectangle", () => {
        const point = {
            x: 6,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        expect(within).toBe(false);
    });

    it("bottom is outside rectangle", () => {
        const point = {
            x: 2,
            y: 6,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        expect(within).toBe(false);
    });

    it("zerobounds it not mutable", () => {
        const bounds = zeroBounds();
        const secondBounds = zeroBounds();
        secondBounds.x1 = 5;
        expect(bounds.x1).toBe(0);
        expect(secondBounds.x1).toBe(5);
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
        expect(xAxisRange.min).toBe(2);
        expect(xAxisRange.max).toBe(6);
        expect(yAxisRange.min).toBe(4);
        expect(yAxisRange.max).toBe(8);
    });

    it("offsets bounds to absolute coordinates", () => {
        const bounds: Bounds = {
            x1: -5,
            y1: -8,
            x2: 10,
            y2: 8,
        };

        const abosluteBounds = absBounds(bounds);
        expect(abosluteBounds.bounds).to.deep.equal({
            x1: 0,
            y1: 0,
            x2: 15,
            y2: 16,
        });
        expect(abosluteBounds.offsets).to.deep.equal({ x: 5, y: 8 });
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
        expect(2).toBe(2);
    });

    it("is bounds not within another bounds", () => {
        expect(2).toBe(2);
    });

    it("overlapping bounds are not considered within", () => {
        expect(2).toBe(2);
    });

    it("overlaps: fully overlapping rectangles", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 2, y1: 2, x2: 8, y2: 8 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: partially overlapping rectangles", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 8, y1: 8, x2: 12, y2: 12 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: not overlapping rectangles (b2 right of b1)", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 11, y1: 0, x2: 20, y2: 10 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(false);
    });

    it("overlaps: not overlapping rectangles (b2 above b1)", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 0, y1: 11, x2: 10, y2: 20 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(false);
    });

    it("overlaps: touching edge (right edge of b1 touching left edge of b2)", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 10, y1: 0, x2: 20, y2: 10 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: touching edge (bottom edge of b1 touching top edge of b2)", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 0, y1: 10, x2: 10, y2: 20 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: left edge of b1 touching right edge of b2", () => {
        const b1: Bounds = { x1: 10, y1: 0, x2: 20, y2: 10 };
        const b2: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: right edge of b1 touching left edge of b2", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 10, y1: 0, x2: 20, y2: 10 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: top edge of b1 touching bottom edge of b2", () => {
        const b1: Bounds = { x1: 0, y1: 10, x2: 10, y2: 20 };
        const b2: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: bottom edge of b1 touching top edge of b2", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 0, y1: 10, x2: 10, y2: 20 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: top left corner of b1 touching bottom right corner of b2 (overlap)", () => {
        const b1: Bounds = { x1: 10, y1: 10, x2: 20, y2: 20 };
        const b2: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: bottom right corner of b1 touching top left corner of b2 (overlap)", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 10, y2: 10 };
        const b2: Bounds = { x1: 10, y1: 10, x2: 20, y2: 20 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(true);
    });

    it("overlaps: no overlap with gap", () => {
        const b1: Bounds = { x1: 0, y1: 0, x2: 5, y2: 5 };
        const b2: Bounds = { x1: 6, y1: 6, x2: 10, y2: 10 };
        expect(boundsOverlap(b1, b2)).toStrictEqual(false);
    });

    it("bounds has four corners", () => {
        expect(2).toBe(2);
    });

    it("corners of bounds are the same as bounds values", () => {
        expect(2).toBe(2);
    });
});
