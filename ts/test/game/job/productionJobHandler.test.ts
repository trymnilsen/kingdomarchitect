import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createProductionJob,
    ProductionJobId,
} from "../../../src/game/job/productionJob.ts";
import { createProductionComponent } from "../../../src/game/component/productionComponent.ts";
import {
    createInventoryComponent,
    getInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { JobRunnerComponentId } from "../../../src/game/component/jobRunnerComponent.ts";
import { stoneResource } from "../../../src/data/inventory/items/resources.ts";
import { JobTestHarness } from "./jobTestHarness.ts";

describe("productionJobHandler", () => {
    describe("Job Execution", () => {
        it("completes job when building entity not found", () => {
            const harness = new JobTestHarness();
            const job = createProductionJob("nonexistent-building");

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when building has no ProductionComponent", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            );
            const job = createProductionJob(harness.target.id);

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when production definition not found", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            );
            const job = createProductionJob(harness.target.id);

            // Add ProductionComponent with invalid productionId
            harness.target.setEcsComponent(
                createProductionComponent("invalid_production_id"),
            );

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("increments progress when worker is adjacent to building", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            );
            const job = createProductionJob(harness.target.id);

            harness.target.setEcsComponent(
                createProductionComponent("quarry_production"),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);
            assert.strictEqual(job.progress, 1, "Progress should be 1");

            harness.executeJob(job);
            assert.strictEqual(job.progress, 2, "Progress should be 2");

            assert.strictEqual(
                harness.isJobCompleted(),
                false,
                "Job should still be running",
            );
        });

        it("completes job and adds item to worker inventory for item yield", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            );
            const job = createProductionJob(harness.target.id);

            // quarry_production has duration 10 and yields 10 stone
            harness.target.setEcsComponent(
                createProductionComponent("quarry_production"),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Execute 10 times to complete (duration is 10)
            for (let i = 0; i < 10; i++) {
                harness.executeJob(job);
            }

            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed",
            );

            // Check stone was added to worker inventory
            const workerInventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            const stoneStack = getInventoryItem(
                workerInventory,
                stoneResource.id,
            );

            assert.ok(stoneStack, "Stone should be in worker inventory");
            assert.strictEqual(
                stoneStack.amount,
                10,
                "Should have 10 stone",
            );
        });
    });

    describe("Movement to Target", () => {
        it("moves worker towards building when not adjacent", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 },
                { enablePathfinding: true },
            );
            const job = createProductionJob(harness.target.id);

            harness.target.setEcsComponent(
                createProductionComponent("quarry_production"),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            const initialPosition = { ...harness.runner.worldPosition };

            harness.executeJob(job);

            assert.notDeepStrictEqual(
                harness.runner.worldPosition,
                initialPosition,
                "Worker should have moved",
            );
            assert.strictEqual(
                job.progress,
                0,
                "Progress should still be 0 (not adjacent yet)",
            );
        });
    });
});
