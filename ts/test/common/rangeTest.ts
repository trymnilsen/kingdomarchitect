import { assert } from "chai";
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
        assert.isAtLeast(randomValue, range.min);
        assert.isAtMost(randomValue, range.max);
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
