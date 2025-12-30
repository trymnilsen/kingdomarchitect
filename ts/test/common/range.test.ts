import { describe, it } from "node:test";
import assert from "node:assert";
import {
    NumberRange,
    rangeDistance,
    rangeRandom,
} from "../../src/common/range.ts";

describe("Range", () => {
    it("can pick random number in range", () => {
        const range: NumberRange = {
            min: 5,
            max: 20,
        };
        const randomValue = rangeRandom(range);
        assert.strictEqual(randomValue >= range.min, true);
        assert.strictEqual(randomValue <= range.max, true);
    });

    it("can calculate distance of range", () => {
        const range: NumberRange = {
            min: 5,
            max: 20,
        };
        const distance = rangeDistance(range);
        assert.strictEqual(distance, 15);
    });
});
