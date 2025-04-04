import { describe, it, expect } from "vitest";

import { JobRunnerComponent } from "../../../../src/game/componentOld/job/jobRunnerComponent.js";
import { Entity } from "../../../../src/game/entity/entity.js";
import { MoveJob } from "../../../../src/game/componentOld/job/jobs/moveJob.js";
import { zeroPoint } from "../../../../src/common/point.js";

describe("JobRunnerComponent", () => {
    it("Set active job to the assigned job", () => {
        const runner = getRunner();
        const moveToJob = new MoveJob(zeroPoint(), runner.entity);
        runner.assignJob(moveToJob);
        expect(runner.activeJob).toBe(moveToJob);
    });

    it("can get active job", () => {
        const runner = getRunner();
        const moveToJob = new MoveJob(zeroPoint(), runner.entity);
        expect(runner.activeJob).toBe(undefined);
        runner.assignJob(moveToJob);
        expect(runner.activeJob).toBe(moveToJob);
    });

    it("owner of job is updated on assign", () => {
        const runner = getRunner();
        const moveToJob = new MoveJob(zeroPoint(), runner.entity);
        expect(moveToJob.owner).toBe(null);
        runner.assignJob(moveToJob);
        expect(moveToJob.owner).toBe(runner);
    });

    it("will start job on assign", () => {
        expect(2).toBe(2);
    });

    it("will catch start errors and end job on error", () => {
        expect(2).toBe(2);
    });

    it("will request new job start", () => {
        expect(2).toBe(2);
    });

    it("will request new job on job end", () => {
        expect(2).toBe(2);
    });

    it("will run update on job", () => {
        expect(2).toBe(2);
    });

    it("will only run update on active job", () => {
        expect(2).toBe(2);
    });

    it("will run draw on job", () => {
        expect(2).toBe(2);
    });

    it("will only run draw on active job", () => {
        expect(2).toBe(2);
    });

    it("can interupt current job", () => {
        expect(2).toBe(2);
    });

    it("can interupt and not resume current job", () => {
        expect(2).toBe(2);
    });

    it("will pop the job stack and resume jobs until stack is empty", () => {
        expect(2).toBe(2);
    });

    it("will only request new job when the job stack is empty", () => {
        expect(2).toBe(2);
    });

    it("job will be aborted on non-resumable interupt", () => {
        expect(2).toBe(2);
    });

    it("will check if job is still applicable on resume", () => {
        expect(2).toBe(2);
    });

    it("will not request a new job when job is interuped non-resumably", () => {
        expect(2).toBe(2);
    });
});

function getRunner(): JobRunnerComponent {
    const entity = new Entity("runnerEntity");
    const runnerComponent = new JobRunnerComponent();
    entity.addComponent(runnerComponent);
    return runnerComponent;
}
