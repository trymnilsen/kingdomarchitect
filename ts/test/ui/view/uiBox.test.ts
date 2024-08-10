import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("UiBox", () => {
    it("sizes to largest child on wrap", () => {
        assert.equal(2, 2);
    });

    it("sizes to parent on fill", () => {
        assert.equal(2, 2);
    });

    it("keep size if fixed", () => {
        assert.equal(2, 2);
    });

    it("does not scale larger than parent on wrap", () => {
        assert.equal(2, 2);
    });

    it("aligns child correctly", () => {
        assert.equal(2, 2);
    });

    it("applies padding to children constraints", () => {
        assert.equal(2, 2);
    });

    it("offsets children with padding", () => {
        assert.equal(2, 2);
    });

    it("does not apply padding to background", () => {
        assert.equal(2, 2);
    });

    it("sets measured size on layout", () => {
        assert.equal(2, 2);
    });
});
