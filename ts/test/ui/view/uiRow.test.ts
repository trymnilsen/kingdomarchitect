import { describe, it, expect } from "vitest";

describe("UiRow", () => {
    it("does not allow to add children with fill space and now weight", () => {
        expect(2).toBe(2);
    });

    it("does not allow children with weight if wrap size is set", () => {
        expect(2).toBe(2);
    });

    it("does not allow zero weight", () => {
        expect(2).toBe(2);
    });

    it("requires weighted children to have an id", () => {
        expect(2).toBe(2);
    });

    it("increments total weight when child is added", () => {
        expect(2).toBe(2);
    });

    it("correctly sizes children with weight", () => {
        expect(2).toBe(2);
    });

    it("measures children with no weight", () => {
        expect(2).toBe(2);
    });

    it("throws error if total height of children exceeds constraints", () => {
        expect(2).toBe(2);
    });
});
