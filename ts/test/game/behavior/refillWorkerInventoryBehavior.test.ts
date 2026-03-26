import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import { createRefillWorkerInventoryBehavior } from "../../../src/game/behavior/behaviors/refillWorkerInventoryBehavior.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    createDesiredInventoryComponent,
    DesiredInventoryComponentId,
} from "../../../src/game/component/desiredInventoryComponent.ts";
import { createStockpileComponent } from "../../../src/game/component/stockpileComponent.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import { breadItem, wheatResourceItem } from "../../../src/data/inventory/items/resources.ts";

function createSettlement(id = "settlement"): Entity {
    const settlement = new Entity(id);
    settlement.setEcsComponent(createPlayerKingdomComponent());
    return settlement;
}

function createStockpileWithItem(id: string, itemAmount: number): Entity {
    const stockpile = new Entity(id);
    stockpile.setEcsComponent(createStockpileComponent());
    const inv = createInventoryComponent();
    addInventoryItem(inv, breadItem, itemAmount);
    stockpile.setEcsComponent(inv);
    return stockpile;
}

function createWorker(settlement: Entity, x = 12, y = 8): Entity {
    const worker = new Entity("worker");
    settlement.addChild(worker);
    worker.worldPosition = { x, y };
    worker.setEcsComponent(createInventoryComponent());
    worker.setEcsComponent(
        createDesiredInventoryComponent([{ itemId: breadItem.id, amount: 2 }]),
    );
    return worker;
}

describe("refillWorkerInventoryBehavior", () => {
    describe("isValid", () => {
        it("returns false without DesiredInventoryComponent", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = new Entity("worker");
            settlement.addChild(worker);
            worker.worldPosition = { x: 12, y: 8 };
            worker.setEcsComponent(createInventoryComponent());

            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns false when all desired items are fully stocked", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement);
            addInventoryItem(worker.getEcsComponent(InventoryComponentId)!, breadItem, 2);

            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns false when no stockpile contains any deficit item", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement);

            // Stockpile exists but has wheat, not bread
            const stockpile = new Entity("stockpile");
            stockpile.setEcsComponent(createStockpileComponent());
            const inv = createInventoryComponent();
            addInventoryItem(inv, wheatResourceItem, 5);
            stockpile.setEcsComponent(inv);
            settlement.addChild(stockpile);
            stockpile.worldPosition = { x: 15, y: 8 };

            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns true when entity has a deficit and a stockpile has the item", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement);

            const stockpile = createStockpileWithItem("stockpile", 5);
            settlement.addChild(stockpile);
            stockpile.worldPosition = { x: 15, y: 8 };

            assert.strictEqual(behavior.isValid(worker), true);
        });
    });

    describe("utility", () => {
        it("returns 0 when fully stocked", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement);
            addInventoryItem(worker.getEcsComponent(InventoryComponentId)!, breadItem, 2);

            assert.strictEqual(behavior.utility(worker), 0);
        });

        it("returns higher utility when entity is closer to a relevant stockpile", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();

            const workerClose = new Entity("workerClose");
            settlement.addChild(workerClose);
            workerClose.worldPosition = { x: 12, y: 8 };
            workerClose.setEcsComponent(createInventoryComponent());
            workerClose.setEcsComponent(
                createDesiredInventoryComponent([{ itemId: breadItem.id, amount: 2 }]),
            );

            const workerFar = new Entity("workerFar");
            settlement.addChild(workerFar);
            workerFar.worldPosition = { x: 50, y: 50 };
            workerFar.setEcsComponent(createInventoryComponent());
            workerFar.setEcsComponent(
                createDesiredInventoryComponent([{ itemId: breadItem.id, amount: 2 }]),
            );

            const stockpile = createStockpileWithItem("stockpile", 5);
            settlement.addChild(stockpile);
            stockpile.worldPosition = { x: 13, y: 8 }; // Close to workerClose

            const utilClose = behavior.utility(workerClose);
            const utilFar = behavior.utility(workerFar);

            assert.ok(utilClose > utilFar, "closer worker should have higher utility");
        });

        it("is higher when total deficit fraction is larger", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();

            const stockpile = createStockpileWithItem("stockpile", 5);
            settlement.addChild(stockpile);
            stockpile.worldPosition = { x: 13, y: 8 };

            // Worker with larger deficit (wants 4, has 0)
            const workerLarge = new Entity("workerLarge");
            settlement.addChild(workerLarge);
            workerLarge.worldPosition = { x: 12, y: 8 };
            workerLarge.setEcsComponent(createInventoryComponent());
            workerLarge.setEcsComponent(
                createDesiredInventoryComponent([{ itemId: breadItem.id, amount: 4 }]),
            );

            // Worker with smaller deficit (wants 2, has 1)
            const workerSmall = new Entity("workerSmall");
            settlement.addChild(workerSmall);
            workerSmall.worldPosition = { x: 12, y: 8 };
            const invSmall = createInventoryComponent();
            addInventoryItem(invSmall, breadItem, 1);
            workerSmall.setEcsComponent(invSmall);
            workerSmall.setEcsComponent(
                createDesiredInventoryComponent([{ itemId: breadItem.id, amount: 2 }]),
            );

            assert.ok(
                behavior.utility(workerLarge) > behavior.utility(workerSmall),
                "larger deficit fraction should yield higher utility",
            );
        });
    });

    describe("expand", () => {
        it("produces moveTo + withdrawFromStockpile targeting nearest stockpile with deficit item", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement);

            const stockpile = createStockpileWithItem("stockpile", 5);
            settlement.addChild(stockpile);
            stockpile.worldPosition = { x: 14, y: 8 };

            const actions = behavior.expand(worker);

            assert.strictEqual(actions.length, 2);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "withdrawFromStockpile");
        });

        it("take amount is min(deficit, stockpile availability)", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement); // wants 2 bread, has 0

            // Stockpile only has 1 bread (less than deficit of 2)
            const stockpile = createStockpileWithItem("stockpile", 1);
            settlement.addChild(stockpile);
            stockpile.worldPosition = { x: 14, y: 8 };

            const actions = behavior.expand(worker);
            const withdraw = actions[1] as { type: "withdrawFromStockpile"; amount: number };
            assert.strictEqual(withdraw.amount, 1); // min(2, 1) = 1
        });

        it("returns empty when no stockpile has any deficit item", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 0);
        });

        it("selects the closer of two stockpiles that both contain the item", () => {
            const behavior = createRefillWorkerInventoryBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement); // at {12, 8}

            const nearStockpile = createStockpileWithItem("near", 3);
            settlement.addChild(nearStockpile);
            nearStockpile.worldPosition = { x: 14, y: 8 }; // distance 2

            const farStockpile = createStockpileWithItem("far", 3);
            settlement.addChild(farStockpile);
            farStockpile.worldPosition = { x: 30, y: 8 }; // distance 18

            const actions = behavior.expand(worker);
            const withdraw = actions[1] as { type: "withdrawFromStockpile"; stockpileId: string };
            assert.strictEqual(withdraw.stockpileId, "near");
        });
    });
});
