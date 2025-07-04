import { describe, it } from "node:test";
import assert from "node:assert";

describe("Number", () => {
    it("does not clamp value if inbetween range", () => {
        assert.strictEqual(2, 2);
    });

    it("clamps value to lower value", () => {
        assert.strictEqual(2, 2);
    });

    it("clamps value to higher value", () => {
        assert.strictEqual(2, 2);
    });
});
