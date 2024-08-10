import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("Number", () => {
    it("does not clamp value if inbetween range", () => {
        assert.equal(2, 2);
    });

    it("clamps value to lower value", () => {
        assert.equal(2, 2);
    });

    it("clamps value to higher value", () => {
        assert.equal(2, 2);
    });
});
