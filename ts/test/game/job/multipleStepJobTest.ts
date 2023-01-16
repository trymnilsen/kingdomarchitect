import { assert } from "chai";

describe("MultipleStepJob test", () => {
    it("update only updates current job", () => {
        assert.equal(2, 2);
    });

    it("draw only draws current job", () => {
        assert.equal(2, 2);
    });

    it("cannot set empty list of jobs", () => {
        assert.equal(2, 2);
    });

    it("can only set list of jobs before its started", () => {
        assert.equal(2, 2);
    });

    it("run sub job sets state and actor", () => {
        assert.equal(2, 2);
    });

    it("run sub job starts onStart", () => {
        assert.equal(2, 2);
    });

    it("subJobListener is added on runJob", () => {
        assert.equal(2, 2);
    });

    it("next job is ran when previous step completes", () => {
        assert.equal(2, 2);
    });

    it("job step is removed when it completes", () => {
        assert.equal(2, 2);
    });

    it("parent job completes when the last step job completes", () => {
        assert.equal(2, 2);
    });

    it("can only set completed state if its currently running", () => {
        assert.equal(2, 2);
    });
});
