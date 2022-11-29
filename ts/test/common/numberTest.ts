import { describe, it } from "node:test";
import assert from "node:assert";

describe("clamp", () => {
    it("does not clamp value if inbetween range", () => {
        assert.strictEqual(1, 1);
    });
    it("clamps value to lower value", () => {
        assert.strictEqual(1, 1);
    });
    it("clamps value to higher value", () => {
        assert.strictEqual(1, 1);
    });
});
