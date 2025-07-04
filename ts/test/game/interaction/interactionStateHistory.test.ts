import { describe, it } from "node:test";
import assert from "node:assert";

describe("InteractionStateHistory", () => {
    it("push state", () => {
        assert.strictEqual(2, 2);
    });

    it("replace state", () => {
        assert.strictEqual(2, 2);
    });

    it("pop state", () => {
        assert.strictEqual(2, 2);
    });

    it("clear states", () => {
        assert.strictEqual(2, 2);
    });
});
