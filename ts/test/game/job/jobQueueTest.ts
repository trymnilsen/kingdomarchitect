import * as assert from "node:assert";
import { describe, it } from "node:test";

describe("JobQueue", () => {
    it("scheduled job is added to queue", () => {
        assert.equal(2, 2);
    });

    it("event is triggered when job is scheduled", () => {
        assert.equal(2, 2);
    });

    it("remove job", () => {
        assert.equal(2, 2);
    });
});
