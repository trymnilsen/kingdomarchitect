import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    getInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import { createStockpileComponent } from "../../../../src/game/component/stockpileComponent.ts";
import { executeWithdrawFromStockpileAction } from "../../../../src/game/behavior/actions/withdrawFromStockpileAction.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/Action.ts";

type WithdrawAction = Extract<
    BehaviorActionData,
    { type: "withdrawFromStockpile" }
>;

function createTestScene(): {
    root: Entity;
    worker: Entity;
    stockpile: Entity;
} {
    const root = new Entity("root");
    const worker = new Entity("worker");
    const stockpile = new Entity("stockpile");

    worker.setEcsComponent(createInventoryComponent());
    stockpile.setEcsComponent(createInventoryComponent());
    stockpile.setEcsComponent(createStockpileComponent());

    root.addChild(worker);
    root.addChild(stockpile);

    return { root, worker, stockpile };
}

describe("withdrawFromStockpileAction", () => {
    it("transfers items from stockpile to worker inventory", () => {
        const { worker, stockpile } = createTestScene();

        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 10);

        const action: WithdrawAction = {
            type: "withdrawFromStockpile",
            stockpileId: "stockpile",
            itemId: "wood",
            amount: 5,
        };

        const result = executeWithdrawFromStockpileAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        const workerWood = getInventoryItem(workerInventory, "wood");
        assert.ok(workerWood, "Worker should have wood");
        assert.strictEqual(workerWood?.amount, 5);

        const remainingWood = getInventoryItem(stockpileInventory, "wood");
        assert.strictEqual(remainingWood?.amount, 5);
    });

    it("fails if stockpile entity not found", () => {
        const { worker } = createTestScene();

        const action: WithdrawAction = {
            type: "withdrawFromStockpile",
            stockpileId: "nonexistent",
            itemId: "wood",
            amount: 5,
        };

        const result = executeWithdrawFromStockpileAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if stockpile has insufficient items", () => {
        const { worker, stockpile } = createTestScene();

        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 3);

        const action: WithdrawAction = {
            type: "withdrawFromStockpile",
            stockpileId: "stockpile",
            itemId: "wood",
            amount: 10,
        };

        const result = executeWithdrawFromStockpileAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("fails if entity has no StockpileComponent", () => {
        const root = new Entity("root");
        const worker = new Entity("worker");
        const notAStockpile = new Entity("not-stockpile");

        worker.setEcsComponent(createInventoryComponent());
        notAStockpile.setEcsComponent(createInventoryComponent());
        // No StockpileComponent

        root.addChild(worker);
        root.addChild(notAStockpile);

        const action: WithdrawAction = {
            type: "withdrawFromStockpile",
            stockpileId: "not-stockpile",
            itemId: "wood",
            amount: 5,
        };

        const result = executeWithdrawFromStockpileAction(action, worker);

        assert.strictEqual(result.kind, "failed");
    });

    it("transfers full requested amount when stockpile has exact amount", () => {
        const { worker, stockpile } = createTestScene();

        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 7);

        const action: WithdrawAction = {
            type: "withdrawFromStockpile",
            stockpileId: "stockpile",
            itemId: "wood",
            amount: 7,
        };

        const result = executeWithdrawFromStockpileAction(action, worker);

        assert.strictEqual(result.kind, "complete");

        const workerInventory = worker.getEcsComponent(InventoryComponentId)!;
        assert.strictEqual(
            getInventoryItem(workerInventory, "wood")?.amount,
            7,
        );
        assert.strictEqual(
            getInventoryItem(stockpileInventory, "wood"),
            undefined,
        );
    });
});
