import { describe, it } from "node:test";
import assert from "node:assert";
import { weightedRandomEntry } from "../../src/common/array.ts";

describe("weightedRandomEntry", () => {
    it("Will filter out item with 0 weight", () => {
        const items = ["a", "b", "c"];
        const weights = [0, 1, 1];

        // Run multiple times - should never get "a" since it has weight 0
        for (let i = 0; i < 20; i++) {
            const result = weightedRandomEntry(items, weights);
            assert.notStrictEqual(result, "a");
            assert.ok(result === "b" || result === "c");
        }

        // Test with only one non-zero weight
        const oneNonZero = ["x", "y", "z"];
        const oneWeight = [0, 0, 5];
        assert.strictEqual(weightedRandomEntry(oneNonZero, oneWeight), "z");
    });
});
