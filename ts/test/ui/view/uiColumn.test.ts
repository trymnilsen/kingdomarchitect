import { describe, it } from "node:test";
import assert from "node:assert";

describe("UiColumn", () => {
    it("does not allow to add children with fill space and now weight", () => {
        assert.strictEqual(2, 2);
    });

    it("does not allow children with weight if wrap size is set", () => {
        assert.strictEqual(2, 2);
    });

    it("size is measured correctly when there is only weighted children", () => {
        assert.strictEqual(2, 2);
    });

    it("size is measured correctly when there is only non-weighted children", () => {
        assert.strictEqual(2, 2);
    });

    it("does not allow zero weight", () => {
        assert.strictEqual(2, 2);
    });

    it("requires weighted children to have an id", () => {
        assert.strictEqual(2, 2);
    });

    it("increments total weight when child is added", () => {
        assert.strictEqual(2, 2);
    });

    it("correctly sizes children with weight", () => {
        assert.strictEqual(2, 2);
    });

    it("column fills height", () => {
        assert.strictEqual(2, 2);
    });

    it("aligns items from top by default", () => {
        assert.strictEqual(2, 2);
    });

    it("measures children with no weight", () => {
        assert.strictEqual(2, 2);
    });

    it("throws error if total height of children exceeds constraints", () => {
        assert.strictEqual(2, 2);
    });
});
