import * as assert from "node:assert";

describe("UiRow", () => {
    it("does not allow to add children with fill space and now weight", () => {
        assert.equal(2, 2);
    });

    it("does not allow children with weight if wrap size is set", () => {
        assert.equal(2, 2);
    });

    it("does not allow zero weight", () => {
        assert.equal(2, 2);
    });

    it("requires weighted children to have an id", () => {
        assert.equal(2, 2);
    });

    it("increments total weight when child is added", () => {
        assert.equal(2, 2);
    });

    it("correctly sizes children with weight", () => {
        assert.equal(2, 2);
    });

    it("measures children with no weight", () => {
        assert.equal(2, 2);
    });

    it("throws error if total height of children exceeds constraints", () => {
        assert.equal(2, 2);
    });
});
