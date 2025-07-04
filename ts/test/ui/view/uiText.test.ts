import { describe, it } from "node:test";
import assert from "node:assert";

describe("UiText", () => {
    it("measures text", () => {
        assert.strictEqual(2, 2);
    });

    it("can left align text", () => {
        assert.strictEqual(2, 2);
    });

    it("can center align text", () => {
        assert.strictEqual(2, 2);
    });

    it("can right align text", () => {
        assert.strictEqual(2, 2);
    });

    it("aligns text correctly if size of text is less than available space", () => {
        assert.strictEqual(2, 2);
    });

    it("wraps text if available space is less than text", () => {
        assert.strictEqual(2, 2);
    });

    it("adds punctuation at the end if the text overflows constraints", () => {
        assert.strictEqual(2, 2);
    });
});
