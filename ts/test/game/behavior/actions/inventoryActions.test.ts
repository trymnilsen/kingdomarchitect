import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    getInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import { executeTakeFromInventoryAction } from "../../../../src/game/behavior/actions/takeFromInventoryAction.ts";
import { executeDepositToInventoryAction } from "../../../../src/game/behavior/actions/depositToInventoryAction.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../../../src/data/inventory/items/resources.ts";

function createTestScene(): { root: Entity; worker: Entity; stockpile: Entity } {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const stockpile = new Entity("stockpile");

    worker.worldPosition = { x: 0, y: 0 };
    stockpile.worldPosition = { x: 1, y: 0 }; // Adjacent

    worker.setEcsComponent(createInventoryComponent());
    stockpile.setEcsComponent(createInventoryComponent());

    root.addChild(worker);
    root.addChild(stockpile);

    return { root, worker, stockpile };
}

describe("takeFromInventoryAction", () => {
    it("transfers items from source to worker inventory", () => {
        const { worker, stockpile } = createTestScene();

        // Add items to stockpile
        const stockpileInventory = stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 10);

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "stockpile",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result, "complete");

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        const workerWood = getInventoryItem(workerInventory, "wood");
        assert.strictEqual(workerWood?.amount, 5);

        const stockpileWood = getInventoryItem(stockpileInventory, "wood");
        assert.strictEqual(stockpileWood?.amount, 5);
    });

    it("transfers multiple item types", () => {
        const { worker, stockpile } = createTestScene();

        const stockpileInventory = stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 10);
        addInventoryItem(stockpileInventory, stoneResource, 8);

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "stockpile",
            items: [
                { itemId: "wood", amount: 3 },
                { itemId: "stone", amount: 4 },
            ],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result, "complete");

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        assert.strictEqual(getInventoryItem(workerInventory, "wood")?.amount, 3);
        assert.strictEqual(getInventoryItem(workerInventory, "stone")?.amount, 4);
    });

    it("fails if source entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "nonexistent",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("fails if worker not adjacent to source", () => {
        const { worker, stockpile } = createTestScene();
        stockpile.worldPosition = { x: 10, y: 10 }; // Not adjacent

        const stockpileInventory = stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 10);

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "stockpile",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("completes even if source has no items to take", () => {
        const { worker } = createTestScene();

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "stockpile",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result, "complete");
    });
});

describe("depositToInventoryAction", () => {
    it("transfers items from worker to target inventory", () => {
        const { worker, stockpile } = createTestScene();

        // Add items to worker
        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 10);

        const action = {
            type: "depositToInventory" as const,
            targetEntityId: "stockpile",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeDepositToInventoryAction(action, worker);

        assert.strictEqual(result, "complete");

        const workerWood = getInventoryItem(workerInventory, "wood");
        assert.strictEqual(workerWood?.amount, 5);

        const stockpileInventory = stockpile.getEcsComponent(InventoryComponentId)!;
        const stockpileWood = getInventoryItem(stockpileInventory, "wood");
        assert.strictEqual(stockpileWood?.amount, 5);
    });

    it("transfers multiple item types", () => {
        const { worker, stockpile } = createTestScene();

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 10);
        addInventoryItem(workerInventory, stoneResource, 8);

        const action = {
            type: "depositToInventory" as const,
            targetEntityId: "stockpile",
            items: [
                { itemId: "wood", amount: 3 },
                { itemId: "stone", amount: 4 },
            ],
        };

        const result = executeDepositToInventoryAction(action, worker);

        assert.strictEqual(result, "complete");

        const stockpileInventory = stockpile.getEcsComponent(InventoryComponentId)!;
        assert.strictEqual(getInventoryItem(stockpileInventory, "wood")?.amount, 3);
        assert.strictEqual(getInventoryItem(stockpileInventory, "stone")?.amount, 4);
    });

    it("fails if target entity not found", () => {
        const { worker } = createTestScene();

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 10);

        const action = {
            type: "depositToInventory" as const,
            targetEntityId: "nonexistent",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeDepositToInventoryAction(action, worker);

        assert.strictEqual(result, "failed");
    });

    it("fails if worker not adjacent to target", () => {
        const { worker, stockpile } = createTestScene();
        stockpile.worldPosition = { x: 10, y: 10 }; // Not adjacent

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(workerInventory, woodResourceItem, 10);

        const action = {
            type: "depositToInventory" as const,
            targetEntityId: "stockpile",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeDepositToInventoryAction(action, worker);

        assert.strictEqual(result, "failed");
    });
});
