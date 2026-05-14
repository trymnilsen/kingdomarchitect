import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createDepositHeldBehavior } from "../../../../src/game/behavior/behaviors/DepositHeldBehavior.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    createInventoryComponent,
    InventoryComponentId,
    addInventoryItem,
} from "../../../../src/game/component/inventoryComponent.ts";
import {
    createStockpileComponent,
    setPreferredAmount,
} from "../../../../src/game/component/stockpileComponent.ts";
import { createPlayerKingdomComponent } from "../../../../src/game/component/playerKingdomComponent.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";

function createSettlement(): Entity {
    const settlement = new Entity("settlement");
    settlement.setEcsComponent(createPlayerKingdomComponent());
    return settlement;
}

function createWorker(settlement: Entity): Entity {
    const worker = new Entity("worker");
    worker.worldPosition = { x: 5, y: 5 };
    worker.setEcsComponent(createHeldItemComponent());
    settlement.addChild(worker);
    return worker;
}

function createStockpile(
    settlement: Entity,
    id: string,
    preferences: { itemId: string; amount: number }[] = [],
): Entity {
    const stockpile = new Entity(id);
    const stockpileComp = createStockpileComponent();
    for (const pref of preferences) {
        setPreferredAmount(stockpileComp, pref.itemId, pref.amount);
    }
    stockpile.setEcsComponent(stockpileComp);
    stockpile.setEcsComponent(createInventoryComponent());
    settlement.addChild(stockpile);
    stockpile.worldPosition = { x: 8, y: 5 };
    return stockpile;
}

describe("DepositHeldBehavior", () => {
    it("isValid returns false when held is empty", () => {
        const behavior = createDepositHeldBehavior();
        const settlement = createSettlement();
        const worker = createWorker(settlement);
        createStockpile(settlement, "sp", [
            { itemId: "wood", amount: 10 },
        ]);

        assert.strictEqual(behavior.isValid(worker), false);
    });

    it("isValid returns true when held is occupied and a stockpile accepts", () => {
        const behavior = createDepositHeldBehavior();
        const settlement = createSettlement();
        const worker = createWorker(settlement);
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 3;
        createStockpile(settlement, "sp", [
            { itemId: "wood", amount: 10 },
        ]);

        assert.strictEqual(behavior.isValid(worker), true);
    });

    it("isValid returns true when no preferences are set (any stockpile accepts)", () => {
        const behavior = createDepositHeldBehavior();
        const settlement = createSettlement();
        const worker = createWorker(settlement);
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 3;
        createStockpile(settlement, "sp");

        assert.strictEqual(behavior.isValid(worker), true);
    });

    it("expand returns moveTo + depositToStockpile pair", () => {
        const behavior = createDepositHeldBehavior();
        const settlement = createSettlement();
        const worker = createWorker(settlement);
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 3;
        const stockpile = createStockpile(settlement, "sp", [
            { itemId: "wood", amount: 10 },
        ]);

        const actions = behavior.expand(worker);
        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "depositToStockpile");
        const deposit = actions[1] as { stockpileId: string };
        assert.strictEqual(deposit.stockpileId, stockpile.id);
    });
});
