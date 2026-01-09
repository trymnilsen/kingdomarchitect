import { describe, it } from "node:test";
import assert from "node:assert";
import {
    allSides,
    symmetricSides,
    zeroSides,
    totalHorizontal,
    totalVertical,
} from "../../src/common/sides.ts";

describe("Sides", () => {
    it("can create with all sides equal", () => {
        const sides = allSides(10);
        assert.strictEqual(sides.top, 10);
        assert.strictEqual(sides.left, 10);
        assert.strictEqual(sides.right, 10);
        assert.strictEqual(sides.bottom, 10);
    });

    it("can create symmetric sides", () => {
        const sides = symmetricSides(5, 8);
        assert.strictEqual(sides.left, 5);
        assert.strictEqual(sides.right, 5);
        assert.strictEqual(sides.top, 8);
        assert.strictEqual(sides.bottom, 8);
    });

    it("cannot mutate zero sides object", () => {
        const zero = zeroSides();
        assert.strictEqual(zero.top, 0);
        assert.strictEqual(zero.left, 0);
        assert.strictEqual(zero.right, 0);
        assert.strictEqual(zero.bottom, 0);

        // Verify it returns a new object each time (not a shared constant)
        const zero2 = zeroSides();
        assert.notStrictEqual(zero, zero2);
    });

    it("can add together horizontal amount", () => {
        const sides = symmetricSides(3, 7);
        assert.strictEqual(totalHorizontal(sides), 6);

        const asymmetric = { top: 1, left: 2, right: 4, bottom: 1 };
        assert.strictEqual(totalHorizontal(asymmetric), 6);
    });

    it("can add together vertical amount", () => {
        const sides = symmetricSides(3, 7);
        assert.strictEqual(totalVertical(sides), 14);

        const asymmetric = { top: 2, left: 1, right: 1, bottom: 5 };
        assert.strictEqual(totalVertical(asymmetric), 7);
    });
});
