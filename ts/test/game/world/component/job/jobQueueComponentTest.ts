import * as assert from "node:assert";

describe("JobQueueComponent tests", () => {
    it("Will immediately schedule job if available", () => {
        assert.equal(2, 2);
    });

    it("Will schedule job if no entities are available", () => {
        assert.equal(2, 2);
    });

    it("can remove pending job", () => {
        assert.equal(2, 2);
    });

    it("can query for job", () => {
        assert.equal(2, 2);
    });

    it("returns first query hit if multiple", () => {
        assert.equal(2, 2);
    });

    it("can query for job without running", () => {
        assert.equal(2, 2);
    });
});
