import { describe, it } from "node:test";
import assert from "node:assert";
import { createHaulBehavior } from "../../../src/game/behavior/behaviors/HaulBehavior.ts";
import { createBehaviorTestEntity } from "./behaviorTestHelpers.ts";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createInventoryComponent } from "../../../src/game/component/inventoryComponent.ts";
import { createEquipmentComponent } from "../../../src/game/component/equipmentComponent.ts";
import { createStockpileComponent } from "../../../src/game/component/stockpileComponent.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";
import { swordItem } from "../../../src/data/inventory/items/equipment.ts";

function createStockpileEntity(id: string, x: number = 5, y: number = 5): Entity {
    const stockpile = new Entity(id);
    stockpile.worldPosition = { x, y };
    stockpile.setEcsComponent(createStockpileComponent());
    stockpile.setEcsComponent(createInventoryComponent());
    return stockpile;
}

function createWorkerWithInventory(
    id: string,
    items: { item: typeof woodResourceItem | typeof swordItem; amount: number }[] = [],
): Entity {
    const worker = createBehaviorTestEntity(id, 0, 0);
    const inventory = createInventoryComponent();
    inventory.items = items.map((i) => ({ item: i.item, amount: i.amount }));
    worker.setEcsComponent(inventory);
    worker.setEcsComponent(createEquipmentComponent());
    return worker;
}

describe("HaulBehavior", () => {
    describe("isValid", () => {
        it("returns false when entity has no inventory", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createBehaviorTestEntity("worker");
            const stockpile = createStockpileEntity("stockpile");
            root.addChild(worker);
            root.addChild(stockpile);

            const valid = behavior.isValid(worker);

            assert.strictEqual(valid, false);
        });

        it("returns false when inventory is empty", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", []);
            const stockpile = createStockpileEntity("stockpile");
            root.addChild(worker);
            root.addChild(stockpile);

            const valid = behavior.isValid(worker);

            assert.strictEqual(valid, false);
        });

        it("returns false when no stockpile exists", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", [
                { item: woodResourceItem, amount: 10 },
            ]);
            root.addChild(worker);

            const valid = behavior.isValid(worker);

            assert.strictEqual(valid, false);
        });

        it("returns true when has items and stockpile exists", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", [
                { item: woodResourceItem, amount: 10 },
            ]);
            const stockpile = createStockpileEntity("stockpile");
            root.addChild(worker);
            root.addChild(stockpile);

            const valid = behavior.isValid(worker);

            assert.strictEqual(valid, true);
        });

        it("returns false when all items are equipped", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", [
                { item: swordItem, amount: 1 },
            ]);
            const equipment = worker.getEcsComponent("equipment")!;
            equipment.slots.main = swordItem;
            const stockpile = createStockpileEntity("stockpile");
            root.addChild(worker);
            root.addChild(stockpile);

            const valid = behavior.isValid(worker);

            assert.strictEqual(valid, false);
        });

        it("returns true when has both equipped and non-equipped items", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", [
                { item: swordItem, amount: 1 },
                { item: woodResourceItem, amount: 10 },
            ]);
            const equipment = worker.getEcsComponent("equipment")!;
            equipment.slots.main = swordItem;
            const stockpile = createStockpileEntity("stockpile");
            root.addChild(worker);
            root.addChild(stockpile);

            const valid = behavior.isValid(worker);

            assert.strictEqual(valid, true);
        });
    });

    describe("utility", () => {
        it("returns 25 (low priority)", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", [
                { item: woodResourceItem, amount: 10 },
            ]);
            root.addChild(worker);

            const utility = behavior.utility(worker);

            assert.strictEqual(utility, 25);
        });
    });

    describe("expand", () => {
        it("returns moveTo and depositToStockpile actions", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", [
                { item: woodResourceItem, amount: 10 },
            ]);
            const stockpile = createStockpileEntity("stockpile", 5, 5);
            root.addChild(worker);
            root.addChild(stockpile);

            const actions = behavior.expand(worker);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.deepStrictEqual((actions[0] as any).target, { x: 5, y: 5 });
            assert.strictEqual(actions[1].type, "depositToStockpile");
            assert.strictEqual((actions[1] as any).stockpileId, "stockpile");
        });

        it("returns empty array when no stockpile exists", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", [
                { item: woodResourceItem, amount: 10 },
            ]);
            root.addChild(worker);

            const actions = behavior.expand(worker);

            assert.strictEqual(actions.length, 0);
        });

        it("selects nearest stockpile when multiple exist", () => {
            const behavior = createHaulBehavior();
            const root = new Entity("root");
            const worker = createWorkerWithInventory("worker", [
                { item: woodResourceItem, amount: 10 },
            ]);
            worker.worldPosition = { x: 10, y: 8 };
            const farStockpile = createStockpileEntity("far-stockpile", 100, 100);
            const nearStockpile = createStockpileEntity("near-stockpile", 2, 2);
            root.addChild(worker);
            root.addChild(farStockpile);
            root.addChild(nearStockpile);

            const actions = behavior.expand(worker);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual((actions[1] as any).stockpileId, "near-stockpile");
        });
    });

    describe("name", () => {
        it("has name 'haul'", () => {
            const behavior = createHaulBehavior();

            assert.strictEqual(behavior.name, "haul");
        });
    });
});
