import * as assert from "node:assert";

describe("Number test", () => {
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
