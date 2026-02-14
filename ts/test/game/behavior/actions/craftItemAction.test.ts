import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    getInventoryItem,
    addInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import { executeCraftItemAction } from "../../../../src/game/behavior/actions/craftItemAction.ts";
import { planksRecipe } from "../../../../src/data/crafting/recipes/carpenterRecipes.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/Action.ts";

type CraftItemAction = Extract<BehaviorActionData, { type: "craftItem" }>;

function createTestScene(): {
    root: Entity;
    worker: Entity;
    building: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const building = new Entity("building");

    worker.worldPosition = { x: 10, y: 8 };
    building.worldPosition = { x: 11, y: 8 }; // Adjacent

    worker.setEcsComponent(createInventoryComponent());
    building.setEcsComponent(createInventoryComponent());

    root.addChild(worker);
    root.addChild(building);

    return { root, worker, building };
}

describe("craftItemAction", () => {
    it("consumes inputs on first tick", () => {
        const { worker } = createTestScene();

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 10);

        const action: CraftItemAction = {
            type: "craftItem",
            buildingId: "building",
            recipe: planksRecipe,
        };

        executeCraftItemAction(action, worker);

        assert.strictEqual(action.inputsConsumed, true);

        const wood = getInventoryItem(workerInventory, "wood");
        assert.strictEqual(wood?.amount, 6); // 10 - 4 consumed
    });

    it("does not consume inputs again on subsequent ticks", () => {
        const { worker } = createTestScene();

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 10);

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
            inputsConsumed: true,
            progress: 1,
        };

        executeCraftItemAction(action, worker);

        const wood = getInventoryItem(workerInventory, "wood");
        assert.strictEqual(wood?.amount, 10); // Unchanged
    });

    it("tracks progress on action object", () => {
        const { worker } = createTestScene();

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 10);

        const action: CraftItemAction = {
            type: "craftItem",
            buildingId: "building",
            recipe: planksRecipe,
        };

        executeCraftItemAction(action, worker);

        assert.strictEqual(action.progress, 1);
    });

    it("completes and outputs to building when progress reaches duration", () => {
        const { worker, building } = createTestScene();

        // planksRecipe has duration: 3
        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
            inputsConsumed: true,
            progress: 2,
        };

        const result = executeCraftItemAction(action, worker);

        assert.strictEqual(result, "complete");

        const buildingInventory =
            building.getEcsComponent(InventoryComponentId)!;
        const planks = getInventoryItem(buildingInventory, "planks");
        assert.ok(planks);
        assert.strictEqual(planks.amount, 2);
    });

    it("fails if worker lacks required materials", () => {
        const { worker } = createTestScene();

        // Worker has no wood
        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
        };

        const result = executeCraftItemAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("fails if worker has insufficient materials", () => {
        const { worker } = createTestScene();

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 2); // Need 4

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
        };

        const result = executeCraftItemAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("fails if building entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "craftItem" as const,
            buildingId: "nonexistent",
            recipe: planksRecipe,
        };

        const result = executeCraftItemAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("fails if worker not adjacent to building", () => {
        const { worker, building } = createTestScene();
        building.worldPosition = { x: 25, y: 25 }; // Not adjacent

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
        };

        const result = executeCraftItemAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("throws if worker has no inventory", () => {
        const { root, building } = createTestScene();
        const workerNoInv = new Entity("workerNoInv");
        workerNoInv.worldPosition = { x: 10, y: 8 };
        root.addChild(workerNoInv);

        const action = {
            type: "craftItem" as const,
            buildingId: "building",
            recipe: planksRecipe,
        };

        assert.throws(() => {
            executeCraftItemAction(action, workerNoInv);
        });
    });

    it("throws if building has no inventory", () => {
        const { root, worker } = createTestScene();
        const buildingNoInv = new Entity("buildingNoInv");
        buildingNoInv.worldPosition = { x: 11, y: 8 };
        root.addChild(buildingNoInv);

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 10);

        const action = {
            type: "craftItem" as const,
            buildingId: "buildingNoInv",
            recipe: planksRecipe,
        };

        assert.throws(() => {
            executeCraftItemAction(action, worker);
        });
    });
});
