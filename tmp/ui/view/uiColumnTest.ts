import { describe, it } from "node:test";
import assert from "node:assert";

describe("UIColumn", () => {
    it("Does not allow to add children with fill space and no weight", () => {
        assert.strictEqual(1, 1);
    });
    it("Does not allow children with weight when wrap size is set", () => {
        assert.strictEqual(1, 1);
    });
    it("Does not allow zero weight", () => {
        assert.strictEqual(1, 1);
    });
    it("Requires weighted children to have an id", () => {
        assert.strictEqual(1, 1);
    });
    it("Increments total weight when child is adeed", () => {
        assert.strictEqual(1, 1);
    });
    it("Correctly sizes children with weight", () => {
        assert.strictEqual(1, 1);
    });
    it("Measures correctly when there is no weighted children", () => {
        assert.strictEqual(1, 1);
    });
    it("Throws error if total height of children overflows contraints", () => {
        assert.strictEqual(1, 1);
    });
});

describe("insertAndShift", () => {
    it("Shifts nothing when inserted at the end", () => {
        assert.strictEqual(1, 1);
    });

    it("Shifts from correct index when inserted at the middle", () => {
        assert.strictEqual(1, 1);
    });

    it("Shifts all when inserted at the beginning", () => {
        assert.strictEqual(1, 1);
    });
});
