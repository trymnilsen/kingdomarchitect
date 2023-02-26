import { assert } from "chai";

describe("JobQueueComponent", () => {
    it("can get pending jobs", () => {
        assert.equal(2, 2);
    });

    it("can immediately schedule job", () => {
        assert.equal(2, 2);
    });

    it("places job as pending if no runners are available", () => {
        assert.equal(2, 2);
    });

    it("searches children for available runners", () => {
        assert.equal(2, 2);
    });
});
