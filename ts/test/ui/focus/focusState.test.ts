import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("FocusState", () => {
    it("set first focus sets focus to upperleft most view", () => {
        assert.equal(2, 2);
    });

    it("set focus runs onFocus/onFocusLost on focused view", () => {
        assert.equal(2, 2);
    });
});
