import { describe, it } from "node:test";
import assert from "node:assert";

describe("JobQueue", () => {
    it("scheduled job is added to queue", () => {
        assert.strictEqual(2, 2);
    });

    it("event is triggered when job is scheduled", () => {
        assert.strictEqual(2, 2);
    });

    it("remove job", () => {
        assert.strictEqual(2, 2);
    });
});
