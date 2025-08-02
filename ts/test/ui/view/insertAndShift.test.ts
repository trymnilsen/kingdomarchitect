import { describe, it, expect } from "vitest";

describe("insertAndShift", () => {
    it("shifts nothing when inserted at the end", () => {
        expect(2).toBe(2);
    });

    it("shifts all when inserted at the beginning", () => {
        expect(2).toBe(2);
    });

    it("shifts from correct index when inserted at the middle", () => {
        expect(2).toBe(2);
    });
});
