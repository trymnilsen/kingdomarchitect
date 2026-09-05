import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import { createDepositHeldBehavior } from "../../../../src/game/behavior/behaviors/depositHeldBehavior.ts";
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
import { createMinimalWorld } from "../../testWorld.ts";
import { createBuildingComponent } from "../../../../src/game/component/buildingComponent.ts";
import { createSpriteComponent } from "../../../../src/game/component/spriteComponent.ts";

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
    const stockpileComp = createStockpileComponent(200);
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
        createStockpile(settlement, "sp", [{ itemId: "wood", amount: 10 }]);

        assert.strictEqual(behavior.isValid(worker), false);
    });

    it("isValid returns true when held is occupied and a stockpile accepts", () => {
        const behavior = createDepositHeldBehavior();
        const settlement = createSettlement();
        const worker = createWorker(settlement);
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 3;
        createStockpile(settlement, "sp", [{ itemId: "wood", amount: 10 }]);

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

    it("isValid returns true when no stockpile exists (fallback to drop)", () => {
        const behavior = createDepositHeldBehavior();
        const settlement = createSettlement();
        const worker = createWorker(settlement);
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 3;

        assert.strictEqual(behavior.isValid(worker), true);
    });

    it("expand returns dropHeld in place when no stockpile exists", () => {
        const behavior = createDepositHeldBehavior();
        const settlement = createSettlement();
        const worker = createWorker(settlement);
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 3;

        const actions = behavior.expand(worker);
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].type, "dropHeld");
        const drop = actions[0] as {
            destination?: { x: number; y: number };
            reason?: string;
        };
        assert.deepStrictEqual(drop.destination, worker.worldPosition);
        assert.ok(drop.reason?.includes("No accepting stockpile"));
    });

    it("expand moves to a free tile before dropping if standing on an obstacle", () => {
        const { root } = createMinimalWorld();
        const settlement = createSettlement();
        root.addChild(settlement);

        // Put a building under the worker
        const building = new Entity("blocker");
        building.setEcsComponent(createBuildingComponent({} as any, false));
        building.setEcsComponent(
            createSpriteComponent({ bin: "0", spriteId: "test" }),
        );
        root.addChild(building);
        building.worldPosition = { x: 0, y: 0 };

        const worker = createWorker(settlement);
        worker.worldPosition = { x: 0, y: 0 };
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 3;

        const behavior = createDepositHeldBehavior();
        const actions = behavior.expand(worker);

        assert.strictEqual(actions.length, 2);
        assert.strictEqual(actions[0].type, "moveTo");
        assert.strictEqual(actions[1].type, "dropHeld");
        const moveTo = actions[0] as { target: { x: number; y: number } };
        // Target must not be (0, 0) because (0, 0) is blocked by the building
        assert.notDeepStrictEqual(moveTo.target, { x: 0, y: 0 });
    });
});
