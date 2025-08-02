import { describe, it, expect } from "vitest";
import {
    NumberRange,
    rangeDistance,
    rangeRandom,
} from "../../src/common/range.js";

describe("Range", () => {
    it("can pick random number in range", () => {
        const range: NumberRange = {
            min: 5,
            max: 20,
        };
        const randomValue = rangeRandom(range);
        expect(randomValue >= range.min).toBe(true);
        expect(randomValue <= range.max).toBe(true);
    });

    it("can calculate distance of range", () => {
        const range: NumberRange = {
            min: 5,
            max: 20,
        };
        const distance = rangeDistance(range);
        expect(distance).toBe(15);
    });
});
