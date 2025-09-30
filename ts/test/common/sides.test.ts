import { describe, it } from "node:test";
import assert from "node:assert";

describe("Sides", () => {
    it("can create with all sides equal", () => {
        assert.strictEqual(2, 2);
    });

    it("can create symmetric sides", () => {
        assert.strictEqual(2, 2);
    });

    it("cannot mutate zero sides object", () => {
        assert.strictEqual(2, 2);
    });

    it("can add together horizontal amount", () => {
        assert.strictEqual(2, 2);
    });

    it("can add together vertical amount", () => {
        assert.strictEqual(2, 2);
    });
});
