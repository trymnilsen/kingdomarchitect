import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.js";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.js";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.js";
import {
    createInventoryComponent,
    getInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.js";
import { JobRunnerComponentId } from "../../../src/game/component/jobRunnerComponent.js";
import {
    stoneResource,
    ResourceHarvestMode,
} from "../../../src/data/inventory/items/naturalResource.js";
import type { Point } from "../../../src/common/point.js";
import { JobTestHarness } from "./jobTestHarness.js";

describe("MineStoneJob", () => {
    describe("Job Creation", () => {
        it("creates a mining job with correct entity id", () => {
            const entity = new Entity("stone-1");
            const job = CollectResourceJob(entity, ResourceHarvestMode.Mine);

            assert.strictEqual(job.id, "chopTreeJob");
            assert.strictEqual(job.entityId, "stone-1");
            assert.strictEqual(job.harvestAction, ResourceHarvestMode.Mine);
            assert.strictEqual(job.workProgress, 0);
        });
    });

    describe("Job Execution", () => {
        it("completes job when stone entity not found", () => {
            const harness = new JobTestHarness();
            const job = CollectResourceJob(
                new Entity("nonexistent"),
                ResourceHarvestMode.Mine,
            );

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when stone has no resource component", () => {
            const harness = new JobTestHarness();
            // Target has no resource component

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("does not complete job until work duration is met", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent position
            );

            harness.target.setEcsComponent(
                createResourceComponent(stoneResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Stone has workDuration of 3, so first two ticks shouldn't complete
            harness.executeJob(job);
            assert.strictEqual(
                harness.isJobCompleted(),
                false,
                "Job should not complete after 1 tick",
            );

            harness.executeJob(job);
            assert.strictEqual(
                harness.isJobCompleted(),
                false,
                "Job should not complete after 2 ticks",
            );
        });

        it("completes job and grants stone after work duration", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent position
            );

            harness.target.setEcsComponent(
                createResourceComponent(stoneResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Mine for 3 ticks (stone workDuration)
            harness.executeJob(job);
            harness.executeJob(job);
            harness.executeJob(job);

            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed after work duration",
            );

            const inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            const stoneStack = getInventoryItem(inventory, "stone");
            assert.ok(stoneStack, "Stone should be in inventory");
            assert.strictEqual(stoneStack.amount, 2, "Should receive 2 stone");
        });

        it("stone node remains after mining (infinite resource)", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent position
            );

            harness.target.setEcsComponent(
                createResourceComponent(stoneResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            const targetId = harness.target.id;

            // Complete one mining cycle
            harness.executeJob(job);
            harness.executeJob(job);
            harness.executeJob(job);

            assert.strictEqual(
                harness.root.findEntity(targetId),
                harness.target,
                "Stone entity should still exist in the world",
            );
        });

        it("can mine multiple batches from same stone node", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent position
            );

            harness.target.setEcsComponent(
                createResourceComponent(stoneResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            // First batch
            const job1 = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job1,
            });

            harness.executeJob(job1);
            harness.executeJob(job1);
            harness.executeJob(job1);

            let inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            let stoneStack = getInventoryItem(inventory, "stone");
            assert.strictEqual(stoneStack?.amount, 2, "First batch: 2 stone");

            // Second batch - new job on same node
            const job2 = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job2,
            });

            harness.executeJob(job2);
            harness.executeJob(job2);
            harness.executeJob(job2);

            inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            stoneStack = getInventoryItem(inventory, "stone");
            assert.strictEqual(
                stoneStack?.amount,
                4,
                "Second batch: total 4 stone",
            );
        });
    });

    describe("Adjacency Requirements", () => {
        /**
         * Helper function to test adjacency mining in different directions
         */
        function testAdjacentMining(
            description: string,
            runnerPos: Point,
            stonePos: Point,
        ) {
            it(description, () => {
                const harness = new JobTestHarness(runnerPos, stonePos);

                harness.target.setEcsComponent(
                    createResourceComponent(stoneResource.id),
                );
                harness.runner.setEcsComponent(createInventoryComponent());

                const job = CollectResourceJob(
                    harness.target,
                    ResourceHarvestMode.Mine,
                );
                harness.runner.setEcsComponent({
                    id: JobRunnerComponentId,
                    currentJob: job,
                });

                // Execute enough times to complete mining
                harness.executeJob(job);
                harness.executeJob(job);
                harness.executeJob(job);

                const inventory =
                    harness.runner.requireEcsComponent(InventoryComponentId);
                const stoneStack = getInventoryItem(inventory, "stone");
                assert.ok(stoneStack, `Should mine stone when ${description}`);
                assert.strictEqual(
                    stoneStack.amount,
                    2,
                    `Should receive 2 stone when ${description}`,
                );
            });
        }

        // Test all four cardinal directions
        testAdjacentMining(
            "adjacent to the right",
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        );
        testAdjacentMining(
            "adjacent to the left",
            { x: 1, y: 0 },
            { x: 0, y: 0 },
        );
        testAdjacentMining("adjacent above", { x: 0, y: 1 }, { x: 0, y: 0 });
        testAdjacentMining("adjacent below", { x: 0, y: 0 }, { x: 0, y: 1 });
    });

    describe("Movement to Target", () => {
        it("moves runner one step closer to stone when not adjacent", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 }, // 3 tiles away
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(stoneResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            const initialPosition = { ...harness.runner.worldPosition };

            harness.executeJob(job);

            // Runner should have moved one step closer
            assert.notDeepStrictEqual(
                harness.runner.worldPosition,
                initialPosition,
                "Runner should have moved",
            );
            assert.strictEqual(
                harness.runner.worldPosition.x,
                1,
                "Runner should have moved to x=1",
            );
            assert.strictEqual(
                harness.runner.worldPosition.y,
                0,
                "Runner should stay at y=0",
            );

            // Should not have mined yet
            const inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            const stoneStack = getInventoryItem(inventory, "stone");
            assert.strictEqual(
                stoneStack,
                undefined,
                "Should not have mined stone while not adjacent",
            );
        });

        it("moves runner multiple steps until adjacent, then mines stone", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 }, // 3 tiles away
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(stoneResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Execute job to move adjacent (2 movements)
            harness.executeJob(job); // Move to x=1
            assert.strictEqual(harness.runner.worldPosition.x, 1);

            harness.executeJob(job); // Move to x=2 (adjacent to stone at x=3)
            assert.strictEqual(harness.runner.worldPosition.x, 2);

            // Now adjacent, mine for work duration (3 ticks)
            harness.executeJob(job); // Tick 1
            harness.executeJob(job); // Tick 2
            harness.executeJob(job); // Tick 3

            const inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            const stoneStack = getInventoryItem(inventory, "stone");
            assert.ok(stoneStack, "Should have mined stone");
            assert.strictEqual(
                stoneStack.amount,
                2,
                "Should have received 2 stone",
            );
        });

        it("completes job after reaching and mining stone", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 2, y: 0 }, // 2 tiles away
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(stoneResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Move adjacent (1 step to x=1)
            harness.executeJob(job);
            assert.strictEqual(harness.runner.worldPosition.x, 1);

            // Mine (3 ticks for stone)
            harness.executeJob(job);
            harness.executeJob(job);
            harness.executeJob(job);

            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed",
            );

            const inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            const stoneStack = getInventoryItem(inventory, "stone");
            assert.strictEqual(
                stoneStack?.amount,
                2,
                "Should have mined 2 stone",
            );
        });
    });

    describe("Work Progress Tracking", () => {
        it("tracks work progress correctly", () => {
            const harness = new JobTestHarness({ x: 0, y: 0 }, { x: 1, y: 0 });

            harness.target.setEcsComponent(
                createResourceComponent(stoneResource.id),
            );
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Mine,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            assert.strictEqual(job.workProgress, 0, "Initial progress: 0");

            harness.executeJob(job);
            assert.strictEqual(job.workProgress, 1, "After 1 tick: 1");

            harness.executeJob(job);
            assert.strictEqual(job.workProgress, 2, "After 2 ticks: 2");

            harness.executeJob(job);
            // Job completes, so progress should either be 3 or reset
            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should complete",
            );
        });
    });
});
