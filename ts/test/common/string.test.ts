import { describe, it } from "node:test";
import assert from "node:assert";
import { isBlank } from "../../src/common/string.ts";

describe("String", () => {
    it("can check if string is blank", () => {
        // Empty string should be blank
        assert.strictEqual(isBlank(""), true);

        // Whitespace-only strings should be blank
        assert.strictEqual(isBlank(" "), true);
        assert.strictEqual(isBlank("  "), true);
        assert.strictEqual(isBlank("\t"), true);
        assert.strictEqual(isBlank("\n"), true);
        assert.strictEqual(isBlank(" \t\n "), true);

        // Strings with content should not be blank
        assert.strictEqual(isBlank("a"), false);
        assert.strictEqual(isBlank("hello"), false);
        assert.strictEqual(isBlank(" hello "), false);
        assert.strictEqual(isBlank("hello world"), false);
    });
});
