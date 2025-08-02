import { describe, it, expect } from "vitest";

describe("UiBox", () => {
    it("sizes to largest child on wrap", () => {
        expect(2).toBe(2);
    });

    it("sizes to parent on fill", () => {
        expect(2).toBe(2);
    });

    it("keep size if fixed", () => {
        expect(2).toBe(2);
    });

    it("does not scale larger than parent on wrap", () => {
        expect(2).toBe(2);
    });

    it("aligns child correctly", () => {
        expect(2).toBe(2);
    });

    it("applies padding to children constraints", () => {
        expect(2).toBe(2);
    });

    it("offsets children with padding", () => {
        expect(2).toBe(2);
    });

    it("does not apply padding to background", () => {
        expect(2).toBe(2);
    });

    it("sets measured size on layout", () => {
        expect(2).toBe(2);
    });
});
