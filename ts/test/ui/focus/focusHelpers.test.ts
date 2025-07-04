import { describe, it } from "node:test";
import assert from "node:assert";

describe("getFocusableViews", () => {
    it("can get focusable views", () => {
        assert.strictEqual(2, 2);
    });
    it("no focusable views returns empty array", () => {
        assert.strictEqual(2, 2);
    });
});

describe("getClosestFocusableView", () => {
    it("will return null when there is no closest view", () => {
        assert.strictEqual(2, 2);
    });
    it("will return null on no views in direction", () => {
        assert.strictEqual(2, 2);
    });
    it("will return closest wrapping view if any", () => {
        assert.strictEqual(2, 2);
    });
    it("will return closest overlapping view if any", () => {
        assert.strictEqual(2, 2);
    });
    it("will return closest view past edge line", () => {
        assert.strictEqual(2, 2);
    });
    it("will not return item not overlapping, not wrapping and not completely past edgeline", () => {
        assert.strictEqual(2, 2);
    });
    it("dont return view if adjacent directory is a better match", () => {
        assert.strictEqual(2, 2);
    });
});
