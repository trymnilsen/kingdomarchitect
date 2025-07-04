import { describe, test } from "node:test";
import assert from "node:assert";
import {
    intersectRect,
    rect,
    Rectangle,
    splitRectangle,
} from "../../../src/common/structure/rectangle.js";

describe("rectangle2 tests", () => {
    test("B overlaps left edge of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(5, 20, 10, 30);
        const result = splitRectangle(A, B);
        const expected = [
            rect(10, 10, 50, 10), // Top
            rect(10, 50, 50, 10), // Bottom
            rect(15, 20, 45, 30), // Middle (right of B)
        ];
        assert.deepEqual;
        assert.deepStrictEqual(result, expected);
    });

    test("B overlaps right edge of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(55, 20, 10, 30);
        const result = splitRectangle(A, B);
        const expected = [
            rect(10, 10, 50, 10), // Top
            rect(10, 50, 50, 10), // Bottom
            rect(10, 20, 45, 30), // Middle (left of B)
        ];
        assert.deepStrictEqual(result, expected);
    });

    test("B overlaps top edge of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(20, 5, 30, 10);
        const result = splitRectangle(A, B);
        const expected = [
            rect(10, 15, 50, 45), // Bottom
            rect(10, 10, 10, 5), //Left
            rect(50, 10, 10, 5), //Right
        ];
        assert.deepStrictEqual(result, expected);
    });

    test("B overlaps bottom edge of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(20, 55, 30, 10);
        const result = splitRectangle(A, B);
        const expected = [
            rect(10, 10, 50, 45), //Top
            rect(10, 55, 10, 5), //Left
            rect(50, 55, 10, 5), //Right
        ];
        assert.deepStrictEqual(result, expected);
    });
    test("B overlaps top left corner of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(5, 5, 10, 10);
        const result = splitRectangle(A, B);
        // prettier-ignore
        const expected = [
            rect(10, 15, 50, 45), 
            rect(15, 10, 45, 5)
        ];
        assert.deepStrictEqual(result, expected);
    });

    test("B overlaps top right corner of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(55, 5, 10, 10);
        const result = splitRectangle(A, B);
        // prettier-ignore
        const expected = [
            rect(10, 15, 50, 45),
            rect(10, 10, 45, 5)
        ];
        assert.deepStrictEqual(result, expected);
    });

    test("B overlaps bottom left corner of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(5, 55, 10, 10);
        // prettier-ignore
        const expected = [
            rect(10, 10, 50, 45), 
            rect(15, 55, 45, 5)
        ];
        assert.deepStrictEqual(splitRectangle(A, B), expected);
    });

    test("B overlaps bottom right corner of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(55, 55, 10, 10);
        // prettier-ignore
        const expected = [
            rect(10, 10, 50, 45), 
            rect(10, 55, 45, 5)
        ];
        assert.deepStrictEqual(splitRectangle(A, B), expected);
    });

    test("B is larger in height and overlaps left side of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(5, 5, 10, 60);
        const expected = [rect(15, 10, 45, 50)];
        assert.deepStrictEqual(splitRectangle(A, B), expected);
    });

    test("B is larger in height and overlaps right side of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(55, 5, 10, 60);
        const expected = [rect(10, 10, 45, 50)];
        assert.deepStrictEqual(splitRectangle(A, B), expected);
    });

    test("B is larger in width and overlaps top side of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(5, 5, 60, 10);
        const result = splitRectangle(A, B);
        const expected = [rect(10, 15, 50, 45)];
        assert.deepStrictEqual(result, expected);
    });

    test("B is larger in width and overlaps bottom side of A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(5, 55, 60, 10);
        const expected = [rect(10, 10, 50, 45)];
        assert.deepStrictEqual(splitRectangle(A, B), expected);
    });

    test("B splits A horizontally in the middle", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(10, 30, 50, 10);
        // prettier-ignore
        const expected = [
            rect(10, 10, 50, 20), 
            rect(10, 40, 50, 20)
        ];
        assert.deepStrictEqual(splitRectangle(A, B), expected);
    });

    test("B splits A vertically in the middle", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(30, 10, 10, 50);
        // prettier-ignore
        const expected = [
            rect(10, 10, 20, 50), 
            rect(40, 10, 20, 50)
        ];
        assert.deepStrictEqual(splitRectangle(A, B), expected);
    });

    test("B is the same as A", () => {
        const A = rect(10, 10, 50, 50);
        const B = rect(10, 10, 50, 50);
        assert.deepStrictEqual(splitRectangle(A, B), []);
    });

    test("B completely surrounds A", () => {
        const A = rect(20, 20, 10, 10);
        const B = rect(10, 10, 30, 30);
        assert.deepStrictEqual(splitRectangle(A, B), []);
    });

    test("A completely surrounds B", () => {
        const A = rect(10, 10, 30, 30);
        const B = rect(20, 20, 10, 10);
        const expected = [
            rect(10, 10, 30, 10),
            rect(10, 30, 30, 10),
            rect(10, 20, 10, 10),
            rect(30, 20, 10, 10),
        ];
        assert.deepStrictEqual(splitRectangle(A, B), expected);
    });

    test("intersectRect - No intersection", () => {
        const rectA: Rectangle = { x: 10, y: 10, width: 20, height: 20 };
        const rectB: Rectangle = { x: 40, y: 40, width: 20, height: 20 };
        assert.strictEqual(intersectRect(rectA, rectB), null);
    });

    test("intersectRect - Partial intersection", () => {
        const rectA: Rectangle = { x: 10, y: 10, width: 30, height: 30 };
        const rectB: Rectangle = { x: 20, y: 20, width: 30, height: 30 };
        const expectedIntersection: Rectangle = {
            x: 20,
            y: 20,
            width: 20,
            height: 20,
        };
        assert.deepStrictEqual(
            intersectRect(rectA, rectB),
            expectedIntersection,
        );
    });

    test("intersectRect - B inside A", () => {
        const rectA: Rectangle = { x: 10, y: 10, width: 50, height: 50 };
        const rectB: Rectangle = { x: 20, y: 20, width: 20, height: 20 };
        const expectedIntersection: Rectangle = {
            x: 20,
            y: 20,
            width: 20,
            height: 20,
        };
        assert.deepStrictEqual(
            intersectRect(rectA, rectB),
            expectedIntersection,
        );
    });

    test("intersectRect - A inside B", () => {
        const rectA: Rectangle = { x: 20, y: 20, width: 20, height: 20 };
        const rectB: Rectangle = { x: 10, y: 10, width: 50, height: 50 };
        const expectedIntersection: Rectangle = {
            x: 20,
            y: 20,
            width: 20,
            height: 20,
        };
        assert.deepStrictEqual(
            intersectRect(rectA, rectB),
            expectedIntersection,
        );
    });

    test("splitRectangle - No intersection", () => {
        const rectA: Rectangle = { x: 10, y: 10, width: 20, height: 20 };
        const rectB: Rectangle = { x: 40, y: 40, width: 20, height: 20 };
        assert.deepStrictEqual(splitRectangle(rectA, rectB), [rectA]);
    });

    test("splitRectangle - Partial intersection - Top and Left", () => {
        const rectA: Rectangle = { x: 10, y: 10, width: 30, height: 30 };
        const rectB: Rectangle = { x: 20, y: 20, width: 20, height: 20 };
        const expectedSplit: Rectangle[] = [
            { x: 10, y: 10, width: 30, height: 10 }, // Top
            { x: 10, y: 20, width: 10, height: 20 }, // Left
        ];
        assert.deepStrictEqual(splitRectangle(rectA, rectB), expectedSplit);
    });

    test("splitRectangle - Partial intersection - Top, Bottom, Left, Right", () => {
        const rectA: Rectangle = { x: 10, y: 10, width: 50, height: 50 };
        const rectB: Rectangle = { x: 30, y: 30, width: 20, height: 20 };
        const expectedSplit: Rectangle[] = [
            { x: 10, y: 10, width: 50, height: 20 }, // Top
            { x: 10, y: 50, width: 50, height: 10 }, // Bottom
            { x: 10, y: 30, width: 20, height: 20 }, // Left
            { x: 50, y: 30, width: 10, height: 20 }, // Right
        ];
        assert.deepStrictEqual(splitRectangle(rectA, rectB), expectedSplit);
    });

    test("splitRectangle - B fully contains A", () => {
        const rectA: Rectangle = { x: 20, y: 20, width: 10, height: 10 };
        const rectB: Rectangle = { x: 10, y: 10, width: 30, height: 30 };
        assert.deepStrictEqual(splitRectangle(rectA, rectB), []);
    });

    test("splitRectangle - A fully contains B", () => {
        const rectA: Rectangle = { x: 10, y: 10, width: 30, height: 30 };
        const rectB: Rectangle = { x: 20, y: 20, width: 10, height: 10 };
        const expectedSplit: Rectangle[] = [
            { x: 10, y: 10, width: 30, height: 10 },
            { x: 10, y: 30, width: 30, height: 10 },
            { x: 10, y: 20, width: 10, height: 10 },
            { x: 30, y: 20, width: 10, height: 10 },
        ];
        assert.deepStrictEqual(splitRectangle(rectA, rectB), expectedSplit);
    });
});
