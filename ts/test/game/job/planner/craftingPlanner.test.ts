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
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import { createStockpileComponent } from "../../../../src/game/component/stockpileComponent.ts";
import { planksRecipe } from "../../../../src/data/crafting/recipes/carpenterRecipes.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";

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
        it("returns moveTo and craftItem actions", () => {
            const { root, worker, building } = createTestScene();

            const buildingInventory = building.getEcsComponent("Inventory")!;
            addInventoryItem(buildingInventory, woodResourceItem, 10);

            const job = createCraftingJob("building", planksRecipe);
            const actions = planCrafting(root, worker, job);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "craftItem");
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
});
