import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createCraftingJob } from "../../../src/game/job/craftingJob.ts";
import {
    createInventoryComponent,
    getInventoryItem,
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { JobRunnerComponentId } from "../../../src/game/component/jobRunnerComponent.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../../src/data/inventory/items/resources.ts";
import { swordItem } from "../../../src/data/inventory/items/equipment.ts";
import type { Point } from "../../../src/common/point.ts";
import { JobTestHarness } from "./jobTestHarness.ts";
import type { CraftingRecipe } from "../../../src/data/crafting/craftingRecipe.ts";
import { spriteRefs } from "../../../src/asset/sprite.ts";

describe("craftingJob", () => {
    // Helper to create a simple test recipe
    function createTestRecipe(
        id: string = "test_recipe",
        duration: number = 10,
    ): CraftingRecipe {
        return {
            id,
            name: "Test Recipe",
            icon: spriteRefs.sword_skill,
            inputs: [
                { item: woodResourceItem, amount: 5 },
                { item: stoneResource, amount: 3 },
            ],
            outputs: [{ item: swordItem, amount: 1 }],
            duration,
        };
    }

    describe("Job Creation", () => {
        it("creates a job with correct building id and recipe", () => {
            const recipe = createTestRecipe();
            const job = createCraftingJob("blacksmith-1", recipe);

            assert.strictEqual(job.id, "craftingJob");
            assert.strictEqual(job.targetBuilding, "blacksmith-1");
            assert.strictEqual(job.recipe, recipe);
            assert.strictEqual(job.progress, 0);
            assert.strictEqual(job.state, "pending");
        });
    });

    describe("Job Execution", () => {
        it("completes job when building entity not found", () => {
            const harness = new JobTestHarness();
            const recipe = createTestRecipe();
            const job = createCraftingJob("nonexistent-building", recipe);

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when worker has no inventory component", () => {
            const harness = new JobTestHarness();
            const recipe = createTestRecipe();
            const job = createCraftingJob(harness.target.id, recipe);

            harness.target.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when building has no inventory component", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent
            );
            const recipe = createTestRecipe();
            const job = createCraftingJob(harness.target.id, recipe);

            harness.runner.setEcsComponent(createInventoryComponent());
            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(harness.isJobCompleted(), true);
        });

        it("completes job when worker lacks required materials", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent
            );
            const recipe = createTestRecipe();
            const job = createCraftingJob(harness.target.id, recipe);

            // Setup inventories but worker has insufficient materials
            const workerInventory = createInventoryComponent();
            addInventoryItem(workerInventory, woodResourceItem, 2); // Need 5
            harness.runner.setEcsComponent(workerInventory);
            harness.target.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should complete (fail) when materials are insufficient",
            );
        });

        it("consumes materials from worker on first tick", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent
            );
            const recipe = createTestRecipe();
            const job = createCraftingJob(harness.target.id, recipe);

            // Setup inventories with exact materials
            const workerInventory = createInventoryComponent();
            addInventoryItem(workerInventory, woodResourceItem, 5);
            addInventoryItem(workerInventory, stoneResource, 3);
            harness.runner.setEcsComponent(workerInventory);
            harness.target.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job);

            // Check materials were consumed
            const inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            const woodStack = getInventoryItem(inventory, woodResourceItem.id);
            const stoneStack = getInventoryItem(inventory, stoneResource.id);

            assert.strictEqual(
                woodStack,
                undefined,
                "Wood should be completely consumed",
            );
            assert.strictEqual(
                stoneStack,
                undefined,
                "Stone should be completely consumed",
            );

            // Progress should be incremented
            assert.strictEqual(job.progress, 1, "Progress should be 1");
            assert.strictEqual(
                harness.isJobCompleted(),
                false,
                "Job should still be running",
            );
        });

        it("increments progress each tick after consuming materials", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent
            );
            const recipe = createTestRecipe("test", 5); // 5 tick duration
            const job = createCraftingJob(harness.target.id, recipe);

            // Setup inventories
            const workerInventory = createInventoryComponent();
            addInventoryItem(workerInventory, woodResourceItem, 5);
            addInventoryItem(workerInventory, stoneResource, 3);
            harness.runner.setEcsComponent(workerInventory);
            harness.target.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Execute multiple ticks
            harness.executeJob(job); // Tick 1: consume materials, progress = 1
            assert.strictEqual(job.progress, 1);

            harness.executeJob(job); // Tick 2: progress = 2
            assert.strictEqual(job.progress, 2);

            harness.executeJob(job); // Tick 3: progress = 3
            assert.strictEqual(job.progress, 3);

            harness.executeJob(job); // Tick 4: progress = 4
            assert.strictEqual(job.progress, 4);

            assert.strictEqual(
                harness.isJobCompleted(),
                false,
                "Job should not be complete yet",
            );
        });

        it("completes job and adds outputs to building inventory", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent
            );
            const recipe = createTestRecipe("test", 3); // 3 tick duration
            const job = createCraftingJob(harness.target.id, recipe);

            // Setup inventories
            const workerInventory = createInventoryComponent();
            addInventoryItem(workerInventory, woodResourceItem, 5);
            addInventoryItem(workerInventory, stoneResource, 3);
            harness.runner.setEcsComponent(workerInventory);

            const buildingInventory = createInventoryComponent();
            harness.target.setEcsComponent(buildingInventory);

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Execute until completion
            harness.executeJob(job); // progress = 1
            harness.executeJob(job); // progress = 2
            harness.executeJob(job); // progress = 3, completes

            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed",
            );

            // Check output was added to building
            const targetInventory =
                harness.target.requireEcsComponent(InventoryComponentId);
            const swordStack = getInventoryItem(
                targetInventory,
                swordItem.id,
            );

            assert.ok(swordStack, "Sword should be in building inventory");
            assert.strictEqual(
                swordStack.amount,
                1,
                "Should have 1 sword",
            );
        });

        it("handles excess materials correctly", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 1, y: 0 }, // Adjacent
            );
            const recipe = createTestRecipe("test", 2);
            const job = createCraftingJob(harness.target.id, recipe);

            // Setup with excess materials
            const workerInventory = createInventoryComponent();
            addInventoryItem(workerInventory, woodResourceItem, 10); // Need 5
            addInventoryItem(workerInventory, stoneResource, 8); // Need 3
            harness.runner.setEcsComponent(workerInventory);
            harness.target.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            harness.executeJob(job); // Consume materials

            // Check excess materials remain
            const inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            const woodStack = getInventoryItem(inventory, woodResourceItem.id);
            const stoneStack = getInventoryItem(inventory, stoneResource.id);

            assert.ok(woodStack, "Wood should still be in inventory");
            assert.strictEqual(
                woodStack.amount,
                5,
                "Should have 5 wood left",
            );
            assert.ok(stoneStack, "Stone should still be in inventory");
            assert.strictEqual(
                stoneStack.amount,
                5,
                "Should have 5 stone left",
            );
        });
    });

    describe("Adjacency Requirements", () => {
        function testAdjacentCrafting(
            description: string,
            runnerPos: Point,
            buildingPos: Point,
        ) {
            it(description, () => {
                const harness = new JobTestHarness(runnerPos, buildingPos);
                const recipe = createTestRecipe("test", 2);
                const job = createCraftingJob(harness.target.id, recipe);

                // Setup inventories
                const workerInventory = createInventoryComponent();
                addInventoryItem(workerInventory, woodResourceItem, 5);
                addInventoryItem(workerInventory, stoneResource, 3);
                harness.runner.setEcsComponent(workerInventory);
                harness.target.setEcsComponent(createInventoryComponent());

                harness.runner.setEcsComponent({
                    id: JobRunnerComponentId,
                    currentJob: job,
                });

                harness.executeJob(job);

                // Should have consumed materials and started crafting
                assert.strictEqual(
                    job.progress,
                    1,
                    `Should start crafting when ${description}`,
                );
            });
        }

        // Test all four cardinal directions
        testAdjacentCrafting(
            "crafts when adjacent to the right",
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        );
        testAdjacentCrafting(
            "crafts when adjacent to the left",
            { x: 1, y: 0 },
            { x: 0, y: 0 },
        );
        testAdjacentCrafting(
            "crafts when adjacent above",
            { x: 0, y: 1 },
            { x: 0, y: 0 },
        );
        testAdjacentCrafting(
            "crafts when adjacent below",
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        );
    });

    describe("Movement to Target", () => {
        it("moves worker one step closer to building when not adjacent", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 }, // 3 tiles away
                { enablePathfinding: true },
            );
            const recipe = createTestRecipe();
            const job = createCraftingJob(harness.target.id, recipe);

            // Setup inventories
            const workerInventory = createInventoryComponent();
            addInventoryItem(workerInventory, woodResourceItem, 5);
            addInventoryItem(workerInventory, stoneResource, 3);
            harness.runner.setEcsComponent(workerInventory);
            harness.target.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            const initialPosition = { ...harness.runner.worldPosition };

            harness.executeJob(job);

            // Worker should have moved one step closer
            assert.notDeepStrictEqual(
                harness.runner.worldPosition,
                initialPosition,
                "Worker should have moved",
            );
            assert.strictEqual(
                harness.runner.worldPosition.x,
                1,
                "Worker should have moved to x=1",
            );

            // Materials should not be consumed yet (not adjacent)
            assert.strictEqual(
                job.progress,
                0,
                "Progress should still be 0 (not adjacent yet)",
            );
        });

        it("moves worker multiple steps until adjacent, then starts crafting", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 3, y: 0 }, // 3 tiles away
                { enablePathfinding: true },
            );
            const recipe = createTestRecipe("test", 5);
            const job = createCraftingJob(harness.target.id, recipe);

            // Setup inventories
            const workerInventory = createInventoryComponent();
            addInventoryItem(workerInventory, woodResourceItem, 5);
            addInventoryItem(workerInventory, stoneResource, 3);
            harness.runner.setEcsComponent(workerInventory);
            harness.target.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Execute job multiple times to get adjacent
            harness.executeJob(job); // Move to x=1
            assert.strictEqual(harness.runner.worldPosition.x, 1);
            assert.strictEqual(job.progress, 0, "Not adjacent yet");

            harness.executeJob(job); // Move to x=2
            assert.strictEqual(harness.runner.worldPosition.x, 2);

            // Now adjacent, should consume materials and start crafting
            harness.executeJob(job);
            assert.strictEqual(
                job.progress,
                1,
                "Should start crafting after becoming adjacent",
            );

            // Materials should be consumed
            const inventory =
                harness.runner.requireEcsComponent(InventoryComponentId);
            const woodStack = getInventoryItem(
                inventory,
                woodResourceItem.id,
            );
            assert.strictEqual(
                woodStack,
                undefined,
                "Materials should be consumed",
            );
        });

        it("completes job after reaching building and finishing crafting", () => {
            const harness = new JobTestHarness(
                { x: 0, y: 0 },
                { x: 2, y: 0 }, // 2 tiles away
                { enablePathfinding: true },
            );
            const recipe = createTestRecipe("test", 2); // 2 tick duration
            const job = createCraftingJob(harness.target.id, recipe);

            // Setup inventories
            const workerInventory = createInventoryComponent();
            addInventoryItem(workerInventory, woodResourceItem, 5);
            addInventoryItem(workerInventory, stoneResource, 3);
            harness.runner.setEcsComponent(workerInventory);
            harness.target.setEcsComponent(createInventoryComponent());

            harness.runner.setEcsComponent({
                id: JobRunnerComponentId,
                currentJob: job,
            });

            // Move adjacent (1 step gets us adjacent at x=1 to target at x=2)
            harness.executeJob(job); // x=0 -> x=1

            // Now craft
            harness.executeJob(job); // progress = 1
            assert.strictEqual(job.progress, 1);

            harness.executeJob(job); // progress = 2, completes
            assert.strictEqual(
                harness.isJobCompleted(),
                true,
                "Job should be completed",
            );

            // Check output was added to building
            const targetInventory =
                harness.target.requireEcsComponent(InventoryComponentId);
            const swordStack = getInventoryItem(
                targetInventory,
                swordItem.id,
            );
            assert.ok(
                swordStack,
                "Crafted item should be in building inventory",
            );
        });
    });
});
