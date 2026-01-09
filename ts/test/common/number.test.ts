import { describe, it } from "node:test";
import assert from "node:assert";
import { clamp } from "../../src/common/number.ts";

describe("Number", () => {
    it("does not clamp value if inbetween range", () => {
        assert.strictEqual(clamp(5, 0, 10), 5);
        assert.strictEqual(clamp(0, 0, 10), 0);
        assert.strictEqual(clamp(10, 0, 10), 10);
        assert.strictEqual(clamp(7.5, 5, 10), 7.5);
    });

    it("clamps value to lower value", () => {
        assert.strictEqual(clamp(-5, 0, 10), 0);
        assert.strictEqual(clamp(-100, 0, 10), 0);
        assert.strictEqual(clamp(3, 5, 10), 5);
    });

    it("clamps value to higher value", () => {
        assert.strictEqual(clamp(15, 0, 10), 10);
        assert.strictEqual(clamp(100, 0, 10), 10);
        assert.strictEqual(clamp(12, 5, 10), 10);
    });
});
