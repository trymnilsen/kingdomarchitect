import { describe, it } from "node:test";
import assert from "node:assert";
import { weightedRandomEntry } from "../../src/common/array.ts";

describe("weightedRandomEntry", () => {
    it("Will return random item", () => {
        const items = ["a", "b", "c"];
        const weights = [1, 1, 1];

        // Run multiple times to check it returns items from the array
        for (let i = 0; i < 10; i++) {
            const result = weightedRandomEntry(items, weights);
            assert.ok(items.includes(result));
        }

        // Test with a single item
        const singleItem = ["only"];
        const singleWeight = [1];
        assert.strictEqual(weightedRandomEntry(singleItem, singleWeight), "only");

        // Test that higher weight increases probability
        // With weights [100, 1], we should almost always get the first item
        const weightedItems = ["heavy", "light"];
        const heavyWeights = [100, 1];
        let heavyCount = 0;
        for (let i = 0; i < 50; i++) {
            if (weightedRandomEntry(weightedItems, heavyWeights) === "heavy") {
                heavyCount++;
            }
        }
        // Should get "heavy" most of the time (at least 80% with these weights)
        assert.ok(heavyCount > 40);
    });

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
