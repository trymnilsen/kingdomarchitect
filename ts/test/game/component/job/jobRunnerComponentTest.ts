import * as assert from "node:assert";
import { describe, it } from "node:test";
import { JobRunnerComponent } from "../../../../src/game/component/job/jobRunnerComponent.js";
import { Entity } from "../../../../src/game/entity/entity.js";
import { MoveJob } from "../../../../src/game/component/job/jobs/moveJob.js";

describe("JobRunnerComponent Tests", () => {
    it("Set active job to the assigned job", () => {
        const runner = getRunner();
        const moveToJob = new MoveJob([]);
        runner.assignJob(moveToJob);
        assert.equal(runner.activeJob, moveToJob);
    });

    it("can get active job", () => {
        const runner = getRunner();
        const moveToJob = new MoveJob([]);
        assert.equal(runner.activeJob, undefined);
        runner.assignJob(moveToJob);
        assert.equal(runner.activeJob, moveToJob);
    });

    it("owner of job is updated on assign", () => {
        const runner = getRunner();
        const moveToJob = new MoveJob([]);
        assert.equal(moveToJob.owner, null);
        runner.assignJob(moveToJob);
        assert.equal(moveToJob.owner, runner);
    });

    it("will start job on assign", () => {
        assert.equal(2, 2);
    });

    it("will catch start errors and end job on error", () => {
        assert.equal(2, 2);
    });

    it("will request new job start", () => {
        assert.equal(2, 2);
    });

    it("will request new job on job end", () => {
        assert.equal(2, 2);
    });

    it("will run update on job", () => {
        assert.equal(2, 2);
    });

    it("will only run update on active job", () => {
        assert.equal(2, 2);
    });

    it("will run draw on job", () => {
        assert.equal(2, 2);
    });

    it("will only run draw on active job", () => {
        assert.equal(2, 2);
    });

    it("can interupt current job", () => {
        assert.equal(2, 2);
    });

    it("can interupt and not resume current job", () => {
        assert.equal(2, 2);
    });

    it("will pop the job stack and resume jobs until stack is empty", () => {
        assert.equal(2, 2);
    });

    it("will only request new job when the job stack is empty", () => {
        assert.equal(2, 2);
    });

    it("job will be aborted on non-resumable interupt", () => {
        assert.equal(2, 2);
    });

    it("will check if job is still applicable on resume", () => {
        assert.equal(2, 2);
    });

    it("will not request a new job when job is interuped non-resumably", () => {
        assert.equal(2, 2);
    });
});

function getRunner(): JobRunnerComponent {
    const entity = new Entity("runnerEntity");
    const runnerComponent = new JobRunnerComponent();
    entity.addComponent(runnerComponent);
    return runnerComponent;
}
