import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planCrafting } from "../../../../src/game/job/planner/craftingPlanner.ts";
import { createCraftingJob } from "../../../../src/game/job/craftingJob.ts";
import {
    createJobQueueComponent,
    addJob,
    JobQueueComponentId,
} from "../../../../src/game/component/jobQueueComponent.ts";
import { createTileComponent } from "../../../../src/game/component/tileComponent.ts";
import { createChunkMapComponent } from "../../../../src/game/component/chunkMapComponent.ts";
import {
    createInventoryComponent,
    addInventoryItem,
} from "../../../../src/game/component/inventoryComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import { createStockpileComponent } from "../../../../src/game/component/stockpileComponent.ts";
import { planksRecipe } from "../../../../src/data/crafting/recipes/carpenterRecipes.ts";
import {
    woodResourceItem,
    flaxResourceItem,
} from "../../../../src/data/inventory/items/resources.ts";

function createTestScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
    stockpile: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");
    const stockpile = new Entity("stockpile");

    worker.worldPosition = { x: 10, y: 8 };
    building.worldPosition = { x: 15, y: 13 };
    stockpile.worldPosition = { x: 20, y: 8 };

    worker.setEcsComponent(createHeldItemComponent());
    building.setEcsComponent(createInventoryComponent());

    stockpile.setEcsComponent(createStockpileComponent());
    stockpile.setEcsComponent(createInventoryComponent());

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(building);
    root.addChild(stockpile);

    return { root, worker, building, stockpile };
}

describe("craftingPlanner", () => {
    describe("building has all inputs", () => {
        it("returns moveTo, stepOnto and craftItem actions", () => {
            const { root, worker, building } = createTestScene();

            const buildingInventory = building.getEcsComponent("Inventory")!;
            addInventoryItem(buildingInventory, woodResourceItem, 10);

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "stepOnto");
            assert.strictEqual(actions[2].type, "craftItem");
        });
    });

    describe("worker held already has a needed input", () => {
        it("returns moveTo + depositToInventory", () => {
            const { root, worker, building } = createTestScene();
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 4;

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "depositToInventory");
        });
    });

    describe("inputs available in stockpile", () => {
        it("returns withdraw + deposit trip when held empty", () => {
            const { root, worker, stockpile } = createTestScene();

            const stockpileInventory = stockpile.getEcsComponent("Inventory")!;
            addInventoryItem(stockpileInventory, woodResourceItem, 10);

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions.length, 4);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "withdrawFromStockpile");
            assert.strictEqual(actions[2].type, "moveTo");
            assert.strictEqual(actions[3].type, "depositToInventory");
        });
    });

    describe("error cases", () => {
        it("returns empty array if building not found", () => {
            const { root, worker } = createTestScene();
            const job = createCraftingJob("nonexistent", planksRecipe);
            const actions = planCrafting(root, worker, job);
            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array when no source has materials", () => {
            const { root, worker } = createTestScene();
            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);
            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array if building has no inventory", () => {
            const { root, worker } = createTestScene();
            const buildingNoInv = new Entity("buildingNoInv");
            buildingNoInv.worldPosition = { x: 5, y: 5 };
            root.addChild(buildingNoInv);

            const job = createCraftingJob("buildingNoInv", planksRecipe);
            const actions = planCrafting(root, worker, job);
            assert.strictEqual(actions.length, 0);
        });
    });

    describe("temporary blockers suspend rather than delete the job", () => {
        it("keeps a queued craft in the queue (claim released) when no input source exists", () => {
            const { root, worker } = createTestScene();
            const queue = root.requireEcsComponent(JobQueueComponentId);
            const job = createCraftingJob("building", planksRecipe);
            job.claimedBy = worker.id;
            addJob(queue, job);

            const actions = planCrafting(root, worker, job);

            // No source for the wood input: the worker can't make progress now,
            // but the player's queued craft must survive for a later retry.
            assert.strictEqual(actions.length, 0);
            assert.ok(
                queue.jobs.includes(job),
                "job should remain in the queue (suspended, not deleted)",
            );
            assert.strictEqual(
                job.claimedBy,
                undefined,
                "claim should be released so another worker can retry it",
            );
        });

        it("suspends without throwing when held blocks the craft and there is nowhere to drop it", () => {
            const { root, worker } = createTestScene();
            // An empty tile component makes every tile weight 0 (unwalkable),
            // so findDropPosition finds nowhere to set the held item down. A
            // ChunkMap is required by the queryEntity calls the drop search makes.
            root.setEcsComponent(createTileComponent());
            root.setEcsComponent(createChunkMapComponent());

            const queue = root.requireEcsComponent(JobQueueComponentId);
            const job = createCraftingJob("building", planksRecipe);
            job.claimedBy = worker.id;
            addJob(queue, job);

            // Holding flax: not a planks input and not a planks output, so the
            // planner must drop it before fetching wood — but it can't.
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = flaxResourceItem;
            held.amount = 1;

            let actions: ReturnType<typeof planCrafting> | undefined;
            assert.doesNotThrow(() => {
                actions = planCrafting(root, worker, job);
            });

            assert.strictEqual(actions!.length, 0);
            assert.ok(queue.jobs.includes(job));
            assert.strictEqual(job.claimedBy, undefined);
        });

        it("suspends without throwing when held blocks the output and there is nowhere to drop it", () => {
            const { root, worker, building } = createTestScene();
            root.setEcsComponent(createTileComponent());
            root.setEcsComponent(createChunkMapComponent());

            // Building already has every input, so the planner heads straight to
            // crafting and must first free hands for the output (planks).
            const buildingInventory = building.requireEcsComponent("Inventory");
            addInventoryItem(buildingInventory, woodResourceItem, 10);

            const queue = root.requireEcsComponent(JobQueueComponentId);
            const job = createCraftingJob("building", planksRecipe);
            job.claimedBy = worker.id;
            addJob(queue, job);

            // Holding flax (not the planks output) with nowhere to drop it.
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = flaxResourceItem;
            held.amount = 1;

            let actions: ReturnType<typeof planCrafting> | undefined;
            assert.doesNotThrow(() => {
                actions = planCrafting(root, worker, job);
            });

            assert.strictEqual(actions!.length, 0);
            assert.ok(queue.jobs.includes(job));
            assert.strictEqual(job.claimedBy, undefined);
        });
    });
});
