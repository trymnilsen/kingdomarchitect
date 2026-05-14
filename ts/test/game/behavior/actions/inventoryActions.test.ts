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
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../../../src/data/inventory/items/resources.ts";

function createTestScene(): {
    root: Entity;
    worker: Entity;
    stockpile: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const stockpile = new Entity("stockpile");

    worker.worldPosition = { x: 10, y: 8 };
    stockpile.worldPosition = { x: 11, y: 8 }; // Adjacent

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
        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 10);

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "stockpile",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        const workerWood = getInventoryItem(workerInventory, "wood");
        assert.strictEqual(workerWood?.amount, 5);

        const stockpileWood = getInventoryItem(stockpileInventory, "wood");
        assert.strictEqual(stockpileWood?.amount, 5);
    });

    it("transfers multiple item types", () => {
        const { worker, stockpile } = createTestScene();

        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
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

        assert.strictEqual(result.kind, "complete");

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        assert.strictEqual(
            getInventoryItem(workerInventory, "wood")?.amount,
            3,
        );
        assert.strictEqual(
            getInventoryItem(workerInventory, "stone")?.amount,
            4,
        );
    });

    it("fails if source entity not found", () => {
        const { worker } = createTestScene();

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "nonexistent",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if worker not adjacent to source", () => {
        const { worker, stockpile } = createTestScene();
        stockpile.worldPosition = { x: 25, y: 25 }; // Not adjacent

        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 10);

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "stockpile",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("completes even if source has no items to take", () => {
        const { worker } = createTestScene();

        const action = {
            type: "takeFromInventory" as const,
            sourceEntityId: "stockpile",
            items: [{ itemId: "wood", amount: 5 }],
        };

        const result = executeTakeFromInventoryAction(action, worker);

        assert.strictEqual(result.kind, "complete");
    });
});

describe("depositToInventoryAction", () => {
    function createHeldScene(): {
        root: Entity;
        worker: Entity;
        stockpile: Entity;
    } {
        const root = new Entity("root");
        const worker = new Entity("worker");
        const stockpile = new Entity("stockpile");

        worker.worldPosition = { x: 10, y: 8 };
        stockpile.worldPosition = { x: 11, y: 8 };

        worker.setEcsComponent(createHeldItemComponent());
        stockpile.setEcsComponent(createInventoryComponent());

        root.addChild(worker);
        root.addChild(stockpile);
        return { root, worker, stockpile };
    }

    it("transfers held item into target inventory and clears held", () => {
        const { worker, stockpile } = createHeldScene();

        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 5;

        const action = {
            type: "depositToInventory" as const,
            targetEntityId: "stockpile",
        };

        const result = executeDepositToInventoryAction(action, worker);
        assert.strictEqual(result.kind, "complete");

        assert.strictEqual(held.item, null);
        assert.strictEqual(held.amount, 0);

        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
        assert.strictEqual(
            getInventoryItem(stockpileInventory, "wood")?.amount,
            5,
        );
    });

    it("fails when itemId mismatches held", () => {
        const { worker } = createHeldScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 5;

        const action = {
            type: "depositToInventory" as const,
            targetEntityId: "stockpile",
            itemId: "stone",
        };

        const result = executeDepositToInventoryAction(action, worker);
        assert.strictEqual(result.kind, "failed");
        assert.strictEqual(held.item?.id, "wood");
    });

    it("fails if target entity not found", () => {
        const { worker } = createHeldScene();

        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 5;

        const action = {
            type: "depositToInventory" as const,
            targetEntityId: "nonexistent",
        };

        const result = executeDepositToInventoryAction(action, worker);
        assert.strictEqual(result.kind, "failed");
    });

    it("fails if worker not adjacent to target", () => {
        const { worker, stockpile } = createHeldScene();
        stockpile.worldPosition = { x: 25, y: 25 };

        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 5;

        const action = {
            type: "depositToInventory" as const,
            targetEntityId: "stockpile",
        };

        const result = executeDepositToInventoryAction(action, worker);
        assert.strictEqual(result.kind, "failed");
    });
});
