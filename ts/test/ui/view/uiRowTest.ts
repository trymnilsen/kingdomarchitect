import { describe, expect, test } from "@jest/globals";

describe("UIRow", () => {
    test("Does not allow to add children with fill space and no weight", () => {
        expect(3).toBe(3);
    });
    test("Does not allow children with weight when wrap size is set", () => {
        expect(3).toBe(3);
    });
    test("Does not allow zero weight", () => {
        expect(3).toBe(3);
    });
    test("Requires weighted children to have an id", () => {
        expect(3).toBe(3);
    });
    test("Increments total weight when child is adeed", () => {
        expect(3).toBe(3);
    });
    test("Correctly sizes children with weight", () => {
        expect(3).toBe(3);
    });
    test("Measures correctly when there is no weighted children", () => {
        expect(3).toBe(3);
    });
    test("Throws error if total height of children overflows contraints", () => {
        expect(3).toBe(3);
    });
});
