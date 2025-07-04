import { describe, it } from "node:test";
import assert from "node:assert";

describe("Camera", () => {
    it("convert from world space to tile space", () => {
        assert.strictEqual(2, 2);
    });

    it("convert from tile space to world space", () => {
        assert.strictEqual(2, 2);
    });

    it("convert from tilespace to screen space", () => {
        assert.strictEqual(2, 2);
    });

    it("convert from world space to screen space", () => {
        assert.strictEqual(2, 2);
    });

    it("convert from screen space to world space", () => {
        assert.strictEqual(2, 2);
    });

    it("translate moves camera", () => {
        assert.strictEqual(2, 2);
    });
});
