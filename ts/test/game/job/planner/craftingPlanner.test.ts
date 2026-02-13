import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { planCrafting } from "../../../../src/game/job/planner/craftingPlanner.ts";
import { createCraftingJob } from "../../../../src/game/job/craftingJob.ts";
import { createJobQueueComponent } from "../../../../src/game/component/jobQueueComponent.ts";
import {
    createInventoryComponent,
    addInventoryItem,
} from "../../../../src/game/component/inventoryComponent.ts";
import { planksRecipe } from "../../../../src/data/crafting/recipes/carpenterRecipes.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";

function createTestScene(): { root: Entity; worker: Entity; building: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    worker.worldPosition = { x: 0, y: 0 };
    building.worldPosition = { x: 5, y: 5 };

    worker.setEcsComponent(createInventoryComponent());
    building.setEcsComponent(createInventoryComponent());

    root.setEcsComponent(createJobQueueComponent());
    root.addChild(worker);
    root.addChild(building);

    return { root, worker, building };
}

describe("craftingPlanner", () => {
    describe("worker has all inputs", () => {
        it("returns moveTo and craftItem actions", () => {
            const { root, worker, building } = createTestScene();

            const workerInventory = worker.getEcsComponent("Inventory")!;
            addInventoryItem(workerInventory, woodResourceItem, 10);

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "craftItem");
        });

        it("sets correct recipe in craftItem action", () => {
            const { root, worker } = createTestScene();

            const workerInventory = worker.getEcsComponent("Inventory")!;
            addInventoryItem(workerInventory, woodResourceItem, 10);

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            const craftAction = actions[1] as { type: "craftItem"; recipe: typeof planksRecipe };
            assert.strictEqual(craftAction.recipe.id, planksRecipe.id);
        });
    });

    describe("worker needs inputs from building", () => {
        it("returns moveTo, takeFromInventory, and craftItem actions", () => {
            const { root, worker, building } = createTestScene();

            // Worker has no materials, building has them
            const buildingInventory = building.getEcsComponent("Inventory")!;
            addInventoryItem(buildingInventory, woodResourceItem, 10);

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "takeFromInventory");
            assert.strictEqual(actions[2].type, "craftItem");
        });

        it("calculates correct items to take", () => {
            const { root, worker, building } = createTestScene();

            // Worker has 1 wood, needs 4 total (planksRecipe needs 4 wood)
            const workerInventory = worker.getEcsComponent("Inventory")!;
            addInventoryItem(workerInventory, woodResourceItem, 1);

            const buildingInventory = building.getEcsComponent("Inventory")!;
            addInventoryItem(buildingInventory, woodResourceItem, 10);

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            const takeAction = actions[1] as {
                type: "takeFromInventory";
                items: Array<{ itemId: string; amount: number }>
            };

            const woodItem = takeAction.items.find(i => i.itemId === "wood");
            assert.ok(woodItem);
            assert.strictEqual(woodItem.amount, 3); // 4 needed - 1 has = 3 to take
        });
    });

    describe("error cases", () => {
        it("returns empty array if building not found", () => {
            const { root, worker } = createTestScene();

            const job = createCraftingJob("nonexistent", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array if worker has no inventory", () => {
            const { root, building } = createTestScene();
            const workerNoInv = new Entity("workerNoInv");
            workerNoInv.worldPosition = { x: 0, y: 0 };
            root.addChild(workerNoInv);

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, workerNoInv, job);

            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array if no materials available anywhere", () => {
            const { root, worker } = createTestScene();

            // Neither worker nor building has materials
            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions.length, 0);
        });

        it("returns empty array if building has no inventory", () => {
            const { root, worker } = createTestScene();
            const buildingNoInv = new Entity("buildingNoInv");
            buildingNoInv.worldPosition = { x: 5, y: 5 };
            root.addChild(buildingNoInv);

            // Worker doesn't have materials, so planner will try to get from building
            const job = createCraftingJob("buildingNoInv", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions.length, 0);
        });
    });
});
