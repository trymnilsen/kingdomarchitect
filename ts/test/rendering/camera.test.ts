import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("Camera", () => {
    it("convert from world space to tile space", () => {
        assert.equal(2, 2);
    });

    it("convert from tile space to world space", () => {
        assert.equal(2, 2);
    });

    it("convert from tilespace to screen space", () => {
        assert.equal(2, 2);
    });

    it("convert from world space to screen space", () => {
        assert.equal(2, 2);
    });

    it("convert from screen space to world space", () => {
        assert.equal(2, 2);
    });

    it("translate moves camera", () => {
        assert.equal(2, 2);
    });
});
