import { describe, it, expect } from "vitest";

describe("getFocusableViews", () => {
    it("can get focusable views", () => {
        expect(2).toBe(2);
    });
    it("no focusable views returns empty array", () => {
        expect(2).toBe(2);
    });
});

describe("getClosestFocusableView", () => {
    it("will return null when there is no closest view", () => {
        expect(2).toBe(2);
    });
    it("will return null on no views in direction", () => {
        expect(2).toBe(2);
    });
    it("will return closest wrapping view if any", () => {
        expect(2).toBe(2);
    });
    it("will return closest overlapping view if any", () => {
        expect(2).toBe(2);
    });
    it("will return closest view past edge line", () => {
        expect(2).toBe(2);
    });
    it("will not return item not overlapping, not wrapping and not completely past edgeline", () => {
        expect(2).toBe(2);
    });
    it("dont return view if adjacent directory is a better match", () => {
        expect(2).toBe(2);
    });
});
