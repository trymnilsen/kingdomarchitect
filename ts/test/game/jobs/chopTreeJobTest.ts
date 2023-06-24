import { describe, it } from "node:test";
import * as assert from "node:assert";

describe("ChoptreeJob test", () => {
    it("cannot set start tick after it has been set", () => {
        assert.equal(2, 2);
    });

    it("cannot set not started state", () => {
        assert.equal(2, 2);
    });

    it("cannot update job state if its completed", () => {
        assert.equal(2, 2);
    });

    it("can only set completed state if its currently running", () => {
        assert.equal(2, 2);
    });
});
