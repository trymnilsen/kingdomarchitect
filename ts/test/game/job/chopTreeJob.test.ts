import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { CollectResourceJob } from "../../../src/game/job/collectResourceJob.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import {
    createHealthComponent,
    HealthComponentId,
} from "../../../src/game/component/healthComponent.ts";
import {
    createInventoryComponent,
    getInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { JobRunnerComponentId } from "../../../src/game/component/jobRunnerComponent.ts";
import {
    treeResource,
    ResourceHarvestMode,
} from "../../../src/data/inventory/items/naturalResource.ts";
import type { Point } from "../../../src/common/point.ts";
import { JobTestHarness } from "./jobTestHarness.ts";

describe("ChopTreeJob", () => {
    describe("Job Creation", () => {
        it("creates a job with correct entity id", () => {
            const entity = new Entity("tree-1");
            const job = CollectResourceJob(entity, ResourceHarvestMode.Chop);

            assert.strictEqual(job.id, "chopTreeJob");
            assert.strictEqual(job.entityId, "tree-1");
            assert.strictEqual(job.harvestAction, ResourceHarvestMode.Chop);
            assert.strictEqual(job.workProgress, 0);
        });
    });

    describe("Job Execution", () => {
        it("completes job when tree entity not found", () => {
            const harness = new JobTestHarness();
            const job = CollectResourceJob(
                new Entity("nonexistent"),
                ResourceHarvestMode.Chop,
            );

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when tree has no resource component", () => {
            const harness = new JobTestHarness();
            // Target has no resource component
            harness.target.setEcsComponent(createHealthComponent(100, 100));

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Chop,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when tree has no health component", () => {
            const harness = new JobTestHarness();
            // Target has resource but no health
            harness.target.setEcsComponent(
                createResourceComponent(treeResource.id),
            );

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Chop,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when tree health reaches zero", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent position
            );

            harness.target.setEcsComponent(
                createResourceComponent(treeResource.id),
            );
            harness.target.setEcsComponent(createHealthComponent(10, 100)); // Low health

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Chop,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            const health = harness.target.getEcsComponent(HealthComponentId);
            assert.strictEqual(health?.currentHp, 0, "Tree should have 0 HP");
            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed",
            );
        });

        it("removes tree and adds wood to inventory when chopped", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent position to avoid movement
            );

            harness.target.setEcsComponent(
                createResourceComponent(treeResource.id),
            );
            // Set the health to be destroyed in one hit
            harness.target.setEcsComponent(createHealthComponent(10, 100));

            // Setup the runner with an empty inventory
            harness.runner.setEcsComponent(createInventoryComponent());

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Chop,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            const targetId = harness.target.id;

            harness.executeJob(job);

            assert.strictEqual(
                harness.root.findEntity(targetId),
                null,
                "Tree entity should be removed from the world",
            );

            const inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);

            const woodStack = getInventoryItem(inventory, "wood");
            assert.ok(woodStack, "A stack of wood should be in the inventory");
            assert.strictEqual(
                woodStack.amount,
                4,
                "The amount of wood should be 4",
            );
        });
    });

    describe("Adjacency Requirements", () => {
        /**
         * Helper function to test adjacency damage in different directions
         */
        function testAdjacentDamage(
            description: string,
            runnerPos: Point,
            treePos: Point,
        ) {
            it(description, () => {
                const harness = new JobTestHarness(runnerPos, treePos);

                harness.target.setEcsComponent(
                    createResourceComponent(treeResource.id),
                );
                harness.target.setEcsComponent(createHealthComponent(100, 100));

                const job = CollectResourceJob(
                    harness.target,
                    ResourceHarvestMode.Chop,
                );
                harness.runner.setEcsComponent({
                    id: JobRunnerComponentId,
                    currentJob: job,
                });

                harness.executeJob(job);

                const health =
                    harness.target.getEcsComponent(HealthComponentId);
                assert.strictEqual(
                    health?.currentHp,
                    90,
                    `Tree should take damage when ${description}`,
                );
            });
        }

        // Test all four cardinal directions
        testAdjacentDamage(
            "damages tree when adjacent to the right",
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        );
        testAdjacentDamage(
            "damages tree when adjacent to the left",
            { x: 1, y: 0 },
            { x: 0, y: 0 },
        );
        testAdjacentDamage(
            "damages tree when adjacent above",
            { x: 0, y: 1 },
            { x: 0, y: 0 },
        );
        testAdjacentDamage(
            "damages tree when adjacent below",
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        );

        // Note: When runner and tree are at the exact same position,
        // checkAdjacency returns null (not adjacent), so the job will
        // attempt to move, which requires pathfinding setup not in these tests.
    });

    describe("Movement to Target", () => {
        it("moves runner one step closer to tree when not adjacent", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 }, // 3 tiles away
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(treeResource.id),
            );
            harness.target.setEcsComponent(createHealthComponent(100, 100));

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Chop,
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

            // Tree should not be damaged yet
            const health = harness.target.getEcsComponent(HealthComponentId);
            assert.strictEqual(
                health?.currentHp,
                100,
                "Tree should not be damaged while not adjacent",
            );
        });

        it("moves runner multiple steps until adjacent, then damages tree", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 }, // 3 tiles away
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(treeResource.id),
            );
            harness.target.setEcsComponent(createHealthComponent(100, 100));

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Chop,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Execute job 3 times to get adjacent (move from x=0 to x=1, then x=2)
            harness.executeJob(job); // Move to x=1
            assert.strictEqual(harness.runner.worldPosition.x, 1);

            harness.executeJob(job); // Move to x=2
            assert.strictEqual(harness.runner.worldPosition.x, 2);

            // Now adjacent, should damage the tree
            harness.executeJob(job);
            const health = harness.target.getEcsComponent(HealthComponentId);
            assert.strictEqual(
                health?.currentHp,
                90,
                "Tree should be damaged after runner becomes adjacent",
            );
        });

        it("moves runner vertically to reach tree", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 0, y: 3 }, // 3 tiles away vertically
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(treeResource.id),
            );
            harness.target.setEcsComponent(createHealthComponent(100, 100));

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Chop,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            // Runner should have moved one step closer vertically
            assert.strictEqual(
                harness.runner.worldPosition.x,
                0,
                "Runner should stay at x=0",
            );
            assert.strictEqual(
                harness.runner.worldPosition.y,
                1,
                "Runner should have moved to y=1",
            );
        });

        it("completes job after reaching and destroying tree", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 2, y: 0 }, // 2 tiles away
                { enablePathfinding: true },
            );

            harness.target.setEcsComponent(
                createResourceComponent(treeResource.id),
            );
            harness.target.setEcsComponent(createHealthComponent(10, 100)); // Low health

            const job = CollectResourceJob(
                harness.target,
                ResourceHarvestMode.Chop,
            );
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Move adjacent (2 steps)
            harness.executeJob(job); // x=0 -> x=1
            harness.executeJob(job); // x=1 (already adjacent at x=1 to target at x=2)

            // Now chop and complete
            harness.executeJob(job);

            const health = harness.target.getEcsComponent(HealthComponentId);
            assert.strictEqual(
                health?.currentHp,
                0,
                "Tree should be destroyed",
            );
            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed",
            );
        });
    });
});
