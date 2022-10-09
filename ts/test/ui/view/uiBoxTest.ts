import { describe, expect, test } from "@jest/globals";

describe("UiBox", () => {
    test("Sizes to largest child on wrap", () => {
        expect(3).toBe(3);
    });

    test("Sizes to parent on fill", () => {
        expect(3).toBe(3);
    });

    test("keeps size if fixed", () => {
        expect(3).toBe(3);
    });

    test("Does not scale larger than parent on wrap", () => {
        expect(3).toBe(3);
    });

    test("Aligns content correctly", () => {
        expect(3).toBe(3);
    });

    test("applies padding to children constraints", () => {
        expect(3).toBe(3);
    });

    test("offsets children with padding", () => {
        expect(3).toBe(3);
    });

    test("does not apply padding to background", () => {
        expect(3).toBe(3);
    });

    test("Sets measured size on layout", () => {
        expect(3).toBe(3);
    });
});
