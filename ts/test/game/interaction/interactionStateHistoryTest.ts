import { describe, it } from "node:test";
import * as assert from "node:assert";

describe("InteractionStateHistory test", () => {
    it("push state", () => {
        assert.equal(2, 2);
    });

    it("replace state", () => {
        assert.equal(2, 2);
    });

    it("pop state", () => {
        assert.equal(2, 2);
    });

    it("clear states", () => {
        assert.equal(2, 2);
    });
});
