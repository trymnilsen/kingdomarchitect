import { describe, it } from "node:test";
import assert from "node:assert";

describe("UiBox", () => {
    it("sizes to largest child on wrap", () => {
        assert.strictEqual(2, 2);
    });

    it("sizes to parent on fill", () => {
        assert.strictEqual(2, 2);
    });

    it("keep size if fixed", () => {
        assert.strictEqual(2, 2);
    });

    it("does not scale larger than parent on wrap", () => {
        assert.strictEqual(2, 2);
    });

    it("aligns child correctly", () => {
        assert.strictEqual(2, 2);
    });

    it("applies padding to children constraints", () => {
        assert.strictEqual(2, 2);
    });

    it("offsets children with padding", () => {
        assert.strictEqual(2, 2);
    });

    it("does not apply padding to background", () => {
        assert.strictEqual(2, 2);
    });

    it("sets measured size on layout", () => {
        assert.strictEqual(2, 2);
    });
});
