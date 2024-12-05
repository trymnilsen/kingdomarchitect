import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    Sides,
    HorizontalSide,
    VerticalSide,
    allSides,
    symmetricSides,
    zeroSides,
    totalHorizontal,
    totalVertical,
} from "./../../src/common/sides.js"; // Replace with the actual module name

describe("Sides", () => {
    describe("allSides", () => {
        it("should set all sides to the same value", () => {
            const size = 5;
            const expected: Sides = { top: 5, left: 5, right: 5, bottom: 5 };
            assert.deepEqual(allSides(size), expected);
        });
    });

    describe("symmetricSides", () => {
        it("should set horizontal sides to the given horizontal value and vertical sides to the given vertical value", () => {
            const horizontal = 10;
            const vertical = 20;
            const expected: Sides = {
                top: 20,
                left: 10,
                right: 10,
                bottom: 20,
            };
            assert.deepEqual(symmetricSides(horizontal, vertical), expected);
        });
    });

    describe("zeroSides", () => {
        it("should return all sides as 0", () => {
            const expected: Sides = { top: 0, left: 0, right: 0, bottom: 0 };
            assert.deepEqual(zeroSides(), expected);
        });

        it("should not mutate other results when called multiple times", () => {
            const firstZeroSides = zeroSides();
            const secondZeroSides = zeroSides();

            // Assert that both results are the same but distinct
            assert.deepEqual(firstZeroSides, secondZeroSides);
            assert.notStrictEqual(firstZeroSides, secondZeroSides); // Ensure they are different objects
        });
    });

    describe("totalHorizontal", () => {
        it("should correctly calculate the sum of left and right sides", () => {
            const sides: Sides = { top: 5, left: 10, right: 15, bottom: 5 };
            const expected = 25;
            assert.equal(totalHorizontal(sides), expected);
        });

        it("should return 0 for zeroSides", () => {
            const sides = zeroSides();
            const expected = 0;
            assert.equal(totalHorizontal(sides), expected);
        });
    });

    describe("totalVertical", () => {
        it("should correctly calculate the sum of top and bottom sides", () => {
            const sides: Sides = { top: 10, left: 5, right: 5, bottom: 20 };
            const expected = 30;
            assert.equal(totalVertical(sides), expected);
        });

        it("should return 0 for zeroSides", () => {
            const sides = zeroSides();
            const expected = 0;
            assert.equal(totalVertical(sides), expected);
        });
    });
});
