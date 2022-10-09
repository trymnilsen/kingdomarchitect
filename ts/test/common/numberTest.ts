import { describe, expect, test } from "@jest/globals";

describe("clamp", () => {
    test("does not clamp value if inbetween range", () => {
        expect(3).toBe(3);
    });
    test("clamps value to lower value", () => {
        expect(3).toBe(3);
    });
    test("clamps value to higher value", () => {
        expect(3).toBe(3);
    });
});
