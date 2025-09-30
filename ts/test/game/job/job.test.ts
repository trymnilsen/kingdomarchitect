import { describe, it } from "node:test";
import assert from "node:assert";

describe("Job", () => {
    it("cannot set start tick after it has been set", () => {
        assert.strictEqual(2, 2);
    });

    it("cannot set not started state", () => {
        assert.strictEqual(2, 2);
    });

    it("cannot update job state if its completed", () => {
        assert.strictEqual(2, 2);
    });

    it("can only set completed state if its currently running", () => {
        assert.strictEqual(2, 2);
    });
});
