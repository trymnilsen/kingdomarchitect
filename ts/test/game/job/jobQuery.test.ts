import assert from "node:assert";
import { describe, it } from "node:test";
import { countJobsForBuilding } from "../../../src/game/job/jobQuery.ts";
import {
    addJob,
    createJobQueueComponent,
} from "../../../src/game/component/jobQueueComponent.ts";
import {
    createProductionJob,
    ProductionJobId,
} from "../../../src/game/job/productionJob.ts";
import {
    createWindmillJob,
    WindmillJobId,
} from "../../../src/game/job/windmillJob.ts";

describe("countJobsForBuilding", () => {
    it("counts only the jobs targeting the given building", () => {
        const jobQueue = createJobQueueComponent();
        addJob(jobQueue, createProductionJob("forrester-1"));
        addJob(jobQueue, createProductionJob("forrester-1"));
        addJob(jobQueue, createProductionJob("forrester-2"));

        assert.strictEqual(
            countJobsForBuilding(jobQueue, ProductionJobId, "forrester-1"),
            2,
        );
        assert.strictEqual(
            countJobsForBuilding(jobQueue, ProductionJobId, "forrester-2"),
            1,
        );
        assert.strictEqual(
            countJobsForBuilding(jobQueue, ProductionJobId, "forrester-3"),
            0,
        );
    });

    it("does not count another kind of job at the same building", () => {
        const jobQueue = createJobQueueComponent();
        addJob(jobQueue, createWindmillJob("mill-1"));
        addJob(jobQueue, createProductionJob("mill-1"));

        assert.strictEqual(
            countJobsForBuilding(jobQueue, WindmillJobId, "mill-1"),
            1,
        );
    });
});
