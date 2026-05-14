import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    getInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import { createStockpileComponent } from "../../../../src/game/component/stockpileComponent.ts";
import { executeWithdrawFromStockpileAction } from "../../../../src/game/behavior/actions/withdrawFromStockpileAction.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../../../src/data/inventory/items/resources.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/ActionData.ts";

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

    worker.setEcsComponent(createHeldItemComponent());
    stockpile.setEcsComponent(createInventoryComponent());
    stockpile.setEcsComponent(createStockpileComponent());

    root.addChild(worker);
    root.addChild(stockpile);

    return { root, worker, stockpile };
}

describe("withdrawFromStockpileAction", () => {
    it("transfers items from stockpile into the worker's held slot", () => {
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

        const held = worker.getEcsComponent(HeldItemComponentId)!;
        assert.strictEqual(held.item?.id, "wood");
        assert.strictEqual(held.amount, 5);

        const remainingWood = getInventoryItem(stockpileInventory, "wood");
        assert.strictEqual(remainingWood?.amount, 5);
    });

    it("stacks onto held when held already holds the same item id", () => {
        const { worker, stockpile } = createTestScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 2;

        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 4);

        const action: WithdrawAction = {
            type: "withdrawFromStockpile",
            stockpileId: "stockpile",
            itemId: "wood",
            amount: 3,
        };

        const result = executeWithdrawFromStockpileAction(action, worker);
        assert.strictEqual(result.kind, "complete");
        assert.strictEqual(held.amount, 5);
    });

    it("fails when held holds a different item id", () => {
        const { worker, stockpile } = createTestScene();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = stoneResource;
        held.amount = 1;

        const stockpileInventory =
            stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(stockpileInventory, woodResourceItem, 5);

        const action: WithdrawAction = {
            type: "withdrawFromStockpile",
            stockpileId: "stockpile",
            itemId: "wood",
            amount: 3,
        };

        const result = executeWithdrawFromStockpileAction(action, worker);
        assert.strictEqual(result.kind, "failed");
        assert.strictEqual(held.item?.id, "stone");
        assert.strictEqual(held.amount, 1);
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

        worker.setEcsComponent(createHeldItemComponent());
        notAStockpile.setEcsComponent(createInventoryComponent());

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

        const held = worker.getEcsComponent(HeldItemComponentId)!;
        assert.strictEqual(held.item?.id, "wood");
        assert.strictEqual(held.amount, 7);
        assert.strictEqual(
            getInventoryItem(stockpileInventory, "wood"),
            undefined,
        );
    });
});
