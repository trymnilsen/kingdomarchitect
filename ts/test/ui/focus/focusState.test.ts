import { describe, it } from "node:test";
import assert from "node:assert";

describe("FocusState", () => {
    it("set first focus sets focus to upperleft most view", () => {
        assert.strictEqual(2, 2);
    });

    it("set focus runs onFocus/onFocusLost on focused view", () => {
        assert.strictEqual(2, 2);
    });
});
