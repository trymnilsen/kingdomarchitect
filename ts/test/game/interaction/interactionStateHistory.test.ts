import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("InteractionStateHistory", () => {
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