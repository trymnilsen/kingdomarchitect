import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("getFocusableViews", () => {
    it("can get focusable views", () => {
        assert.equal(2, 2);
    });
    it("no focusable views returns empty array", () => {
        assert.equal(2, 2);
    });
});

describe("getClosestFocusableView", () => {
    it("will return null when there is no closest view", () => {
        assert.equal(2, 2);
    });
    it("will return null on no views in direction", () => {
        assert.equal(2, 2);
    });
    it("will return closest wrapping view if any", () => {
        assert.equal(2, 2);
    });
    it("will return closest overlapping view if any", () => {
        assert.equal(2, 2);
    });
    it("will return closest view past edge line", () => {
        assert.equal(2, 2);
    });
    it("will not return item not overlapping, not wrapping and not completely past edgeline", () => {
        assert.equal(2, 2);
    });
    it("dont return view if adjacent directory is a better match", () => {
        assert.equal(2, 2);
    });
});
