import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createRestockBehavior } from "../../../src/game/behavior/behaviors/RestockBehavior.ts";
import { createBehaviorTestEntity } from "./behaviorTestHelpers.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    createStockpileComponent,
    setPreferredAmount,
} from "../../../src/game/component/stockpileComponent.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";

function createStockpileEntity(id: string): Entity {
    const stockpile = new Entity(id);
    stockpile.setEcsComponent(createStockpileComponent());
    stockpile.setEcsComponent(createInventoryComponent());
    return stockpile;
}

function createStockpileWithPreference(
    id: string,
    itemId: string,
    preferred: number,
    current: number,
): Entity {
    const stockpile = createStockpileEntity(id);
    const stockpileComp = stockpile.getEcsComponent("stockpile")!;
    setPreferredAmount(stockpileComp, itemId, preferred);
    if (current > 0) {
        const inv = stockpile.getEcsComponent(InventoryComponentId)!;
        addInventoryItem(inv, woodResourceItem, current);
    }
    return stockpile;
}

describe("RestockBehavior", () => {
    describe("isValid", () => {
        it("returns false when no stockpile deficits exist", () => {
            const behavior = createRestockBehavior();
            const root = new Entity("root");
            const worker = createBehaviorTestEntity("worker");
            worker.setEcsComponent(createInventoryComponent());

            // Stockpile with surplus but no preference = no deficit
            const stockpile = createStockpileEntity("stockpile");
            const inv = stockpile.getEcsComponent(InventoryComponentId)!;
            addInventoryItem(inv, woodResourceItem, 10);

            root.addChild(worker);
            root.addChild(stockpile);

            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns false when deficit exists but no surplus source", () => {
            const behavior = createRestockBehavior();
            const root = new Entity("root");
            const worker = createBehaviorTestEntity("worker");
            worker.setEcsComponent(createInventoryComponent());

            // Stockpile B wants 10 wood but has 0 — deficit exists, no surplus
            const stockpileB = createStockpileWithPreference(
                "stockpile-b",
                "wood",
                10,
                0,
            );

            root.addChild(worker);
            root.addChild(stockpileB);

            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns true when deficit and surplus exist on different stockpiles", () => {
            const behavior = createRestockBehavior();
            const root = new Entity("root");
            const worker = createBehaviorTestEntity("worker");
            worker.setEcsComponent(createInventoryComponent());

            // Stockpile A: 20 wood, no preference — all surplus
            const stockpileA = createStockpileEntity("stockpile-a");
            const invA = stockpileA.getEcsComponent(InventoryComponentId)!;
            addInventoryItem(invA, woodResourceItem, 20);

            // Stockpile B: preferred 10, current 0 — deficit
            const stockpileB = createStockpileWithPreference(
                "stockpile-b",
                "wood",
                10,
                0,
            );

            root.addChild(worker);
            root.addChild(stockpileA);
            root.addChild(stockpileB);

            assert.strictEqual(behavior.isValid(worker), true);
        });

        it("returns false when worker has no inventory component", () => {
            const behavior = createRestockBehavior();
            const root = new Entity("root");
            const worker = createBehaviorTestEntity("worker");
            // No inventory component

            const stockpileA = createStockpileEntity("stockpile-a");
            const invA = stockpileA.getEcsComponent(InventoryComponentId)!;
            addInventoryItem(invA, woodResourceItem, 20);

            const stockpileB = createStockpileWithPreference(
                "stockpile-b",
                "wood",
                10,
                0,
            );

            root.addChild(worker);
            root.addChild(stockpileA);
            root.addChild(stockpileB);

            assert.strictEqual(behavior.isValid(worker), false);
        });
    });

    describe("utility", () => {
        it("returns 15 (static)", () => {
            const behavior = createRestockBehavior();
            const worker = createBehaviorTestEntity("worker");

            assert.strictEqual(behavior.utility(worker), 15);
        });
    });

    describe("expand", () => {
        it("returns 4-action sequence: moveTo source, withdraw, moveTo target, deposit", () => {
            const behavior = createRestockBehavior();
            const root = new Entity("root");
            const worker = createBehaviorTestEntity("worker", 12, 8);
            worker.setEcsComponent(createInventoryComponent());

            const stockpileA = createStockpileEntity("stockpile-a");
            const invA = stockpileA.getEcsComponent(InventoryComponentId)!;
            addInventoryItem(invA, woodResourceItem, 20);

            const stockpileB = createStockpileWithPreference(
                "stockpile-b",
                "wood",
                10,
                0,
            );

            root.addChild(worker);
            root.addChild(stockpileA);
            root.addChild(stockpileB);

            const actions = behavior.expand(worker);

            assert.strictEqual(actions.length, 4);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "withdrawFromStockpile");
            assert.strictEqual(actions[2].type, "moveTo");
            assert.strictEqual(actions[3].type, "depositToStockpile");

            const withdraw = actions[1] as Extract<
                typeof actions[1],
                { type: "withdrawFromStockpile" }
            >;
            assert.strictEqual(withdraw.stockpileId, "stockpile-a");
            assert.strictEqual(withdraw.itemId, "wood");

            const deposit = actions[3] as Extract<
                typeof actions[3],
                { type: "depositToStockpile" }
            >;
            assert.strictEqual(deposit.stockpileId, "stockpile-b");
        });

        it("withdraws correct amount (min of surplus, deficit, capacity)", () => {
            const behavior = createRestockBehavior();
            const root = new Entity("root");
            const worker = createBehaviorTestEntity("worker", 12, 8);
            worker.setEcsComponent(createInventoryComponent());

            // Source has 5 surplus (no preference)
            const stockpileA = createStockpileEntity("stockpile-a");
            const invA = stockpileA.getEcsComponent(InventoryComponentId)!;
            addInventoryItem(invA, woodResourceItem, 5);

            // Target needs 10 (preferred 10, current 0)
            const stockpileB = createStockpileWithPreference(
                "stockpile-b",
                "wood",
                10,
                0,
            );

            root.addChild(worker);
            root.addChild(stockpileA);
            root.addChild(stockpileB);

            const actions = behavior.expand(worker);
            const withdraw = actions[1] as Extract<
                typeof actions[1],
                { type: "withdrawFromStockpile" }
            >;

            // min(surplus=5, deficit=10, capacity=20) = 5
            assert.strictEqual(withdraw.amount, 5);
        });

        it("picks the most severe deficit first (highest deficit/preferred ratio)", () => {
            const behavior = createRestockBehavior();
            const root = new Entity("root");
            const worker = createBehaviorTestEntity("worker", 10, 8);
            worker.setEcsComponent(createInventoryComponent());

            // Source of wood
            const source = createStockpileEntity("source");
            const srcInv = source.getEcsComponent(InventoryComponentId)!;
            addInventoryItem(srcInv, woodResourceItem, 20);

            // Target1: preferred 10, current 5 → deficit 5, ratio 0.5
            const target1 = new Entity("target1");
            target1.setEcsComponent(createInventoryComponent());
            const t1Comp = createStockpileComponent();
            setPreferredAmount(t1Comp, "wood", 10);
            target1.setEcsComponent(t1Comp);
            const t1Inv = target1.getEcsComponent(InventoryComponentId)!;
            addInventoryItem(t1Inv, woodResourceItem, 5);

            // Target2: preferred 10, current 0 → deficit 10, ratio 1.0 (more severe)
            const target2 = createStockpileWithPreference(
                "target2",
                "wood",
                10,
                0,
            );

            root.addChild(worker);
            root.addChild(source);
            root.addChild(target1);
            root.addChild(target2);

            const actions = behavior.expand(worker);
            const deposit = actions[3] as Extract<
                typeof actions[3],
                { type: "depositToStockpile" }
            >;

            // target2 has ratio 1.0 vs target1's 0.5 — should pick target2
            assert.strictEqual(deposit.stockpileId, "target2");
        });
    });

    describe("name", () => {
        it("has name 'restock'", () => {
            const behavior = createRestockBehavior();
            assert.strictEqual(behavior.name, "restock");
        });
    });
});
