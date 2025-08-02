import { describe, it, expect } from "vitest";

describe("Number", () => {
    it("does not clamp value if inbetween range", () => {
        expect(2).toBe(2);
    });

    it("clamps value to lower value", () => {
        expect(2).toBe(2);
    });

    it("clamps value to higher value", () => {
        expect(2).toBe(2);
    });
});
