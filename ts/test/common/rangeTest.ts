import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
    NumberRange,
    rangeDistance,
    rangeRandom,
} from "../../src/common/range.js";

describe("Range test", () => {
    it("can pick random number in range", () => {
        const range: NumberRange = {
            min: 5,
            max: 20,
        };
        const randomValue = rangeRandom(range);
        assert.equal(randomValue >= range.min, true);
        assert.equal(randomValue <= range.max, true);
    });

    it("can calculate distance of range", () => {
        const range: NumberRange = {
            min: 5,
            max: 20,
        };
        const distance = rangeDistance(range);
        assert.equal(distance, 15);
    });
});
