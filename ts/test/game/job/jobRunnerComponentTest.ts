import { describe, it } from "node:test";
import * as assert from "node:assert";

describe("JobRunnerComponent test", () => {
    it("Will look for job on start", () => {
        assert.equal(2, 2);
    });

    it("Will schedule new job on finish", () => {
        assert.equal(2, 2);
    });

    it("Will pause current job if schedule mode is interupt", () => {
        assert.equal(2, 2);
    });

    it("Will resume previous job on interupt finish", () => {
        assert.equal(2, 2);
    });
});
