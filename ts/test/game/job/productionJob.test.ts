import assert from "node:assert";
import { describe, it } from "node:test";
import {
    createProductionJob,
    getProductionJobCountForBuilding,
    clearProductionJobsForBuilding,
    ProductionJobId,
} from "../../../src/game/job/productionJob.ts";
import { createJobQueueComponent } from "../../../src/game/component/jobQueueComponent.ts";
import { addJob } from "../../../src/game/component/jobQueueComponent.ts";

describe("ProductionJob", () => {
    describe("createProductionJob", () => {
        it("creates a job with correct building id", () => {
            const job = createProductionJob("forrester-1");

            assert.strictEqual(job.id, ProductionJobId);
            assert.strictEqual(job.targetBuilding, "forrester-1");
            assert.strictEqual(job.progress, 0);
            assert.strictEqual(job.state, "pending");
        });
    });

    describe("getProductionJobCountForBuilding", () => {
        it("returns 0 for empty queue", () => {
            const jobQueue = createJobQueueComponent();
            const count = getProductionJobCountForBuilding(
                jobQueue,
                "building-1",
            );
            assert.strictEqual(count, 0);
        });

        it("counts jobs for specific building", () => {
            const jobQueue = createJobQueueComponent();

            addJob(jobQueue, createProductionJob("building-1"));
            addJob(jobQueue, createProductionJob("building-1"));
            addJob(jobQueue, createProductionJob("building-2"));

            const count1 = getProductionJobCountForBuilding(
                jobQueue,
                "building-1",
            );
            const count2 = getProductionJobCountForBuilding(
                jobQueue,
                "building-2",
            );

            assert.strictEqual(count1, 2);
            assert.strictEqual(count2, 1);
        });

        it("returns 0 for non-existent building", () => {
            const jobQueue = createJobQueueComponent();
            addJob(jobQueue, createProductionJob("building-1"));

            const count = getProductionJobCountForBuilding(
                jobQueue,
                "non-existent",
            );
            assert.strictEqual(count, 0);
        });
    });

    describe("clearProductionJobsForBuilding", () => {
        it("removes pending jobs for specific building", () => {
            const jobQueue = createJobQueueComponent();

            addJob(jobQueue, createProductionJob("building-1"));
            addJob(jobQueue, createProductionJob("building-1"));
            addJob(jobQueue, createProductionJob("building-2"));

            clearProductionJobsForBuilding(jobQueue, "building-1");

            const count1 = getProductionJobCountForBuilding(
                jobQueue,
                "building-1",
            );
            const count2 = getProductionJobCountForBuilding(
                jobQueue,
                "building-2",
            );

            assert.strictEqual(count1, 0);
            assert.strictEqual(count2, 1);
        });

        it("keeps claimed jobs", () => {
            const jobQueue = createJobQueueComponent();

            const job1 = createProductionJob("building-1");
            const job2 = createProductionJob("building-1");
            job2.state = "claimed";
            job2.claimedBy = "worker-1";

            addJob(jobQueue, job1);
            jobQueue.jobs.push(job2); // Add directly to preserve claimed state

            clearProductionJobsForBuilding(jobQueue, "building-1");

            assert.strictEqual(jobQueue.jobs.length, 1);
            assert.strictEqual(jobQueue.jobs[0].state, "claimed");
        });

        it("does nothing for non-existent building", () => {
            const jobQueue = createJobQueueComponent();
            addJob(jobQueue, createProductionJob("building-1"));

            clearProductionJobsForBuilding(jobQueue, "non-existent");

            assert.strictEqual(jobQueue.jobs.length, 1);
        });
    });
});
