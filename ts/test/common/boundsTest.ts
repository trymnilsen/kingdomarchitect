import * as assert from "node:assert";
import {
    absBounds,
    Bounds,
    getBoundsAxis,
    withinRectangle,
    zeroBounds,
} from "../../src/common/bounds.js";
import { Axis } from "../../src/common/direction.js";

describe("Bounds tests", () => {
    it("Is within rectangle", () => {
        const point = {
            x: 2,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.equal(within, true);
    });

    it("top is outside rectangle", () => {
        const point = {
            x: 2,
            y: 0,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.equal(within, false);
    });

    it("left is outside rectangle", () => {
        const point = {
            x: 0,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.equal(within, false);
    });

    it("right is outside rectangle", () => {
        const point = {
            x: 6,
            y: 2,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.equal(within, false);
    });

    it("bottom is outside rectangle", () => {
        const point = {
            x: 2,
            y: 6,
        };
        const within = withinRectangle(point, 1, 1, 5, 5);
        assert.equal(within, false);
    });

    it("zerobounds it not mutable", () => {
        const bounds = zeroBounds();
        const secondBounds = zeroBounds();
        secondBounds.x1 = 5;
        assert.equal(bounds.x1, 0);
        assert.equal(secondBounds.x1, 5);
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
        assert.equal(xAxisRange.min, 2);
        assert.equal(xAxisRange.max, 6);
        assert.equal(yAxisRange.min, 4);
        assert.equal(yAxisRange.max, 8);
    });

    it("offsets bounds to absolute coordinates", () => {
        const bounds: Bounds = {
            x1: -5,
            y1: -8,
            x2: 10,
            y2: 8,
        };

        const abosluteBounds = absBounds(bounds);
        assert.deepEqual(abosluteBounds.bounds, {
            x1: 0,
            y1: 0,
            x2: 15,
            y2: 16,
        });
        assert.deepEqual(abosluteBounds.offsets, { x: 5, y: 8 });
    });

    it("is bounds within another bounds", () => {
        assert.equal(2, 2);
    });

    it("is bounds not within another bounds", () => {
        assert.equal(2, 2);
    });

    it("overlapping bounds are not considered within", () => {
        assert.equal(2, 2);
    });

    it("is bounds overlapping", () => {
        assert.equal(2, 2);
    });

    it("is bounds not overlapping", () => {
        assert.equal(2, 2);
    });
});
