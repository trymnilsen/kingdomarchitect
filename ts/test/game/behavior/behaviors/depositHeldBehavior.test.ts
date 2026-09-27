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
    it("expand deposits at an accepting stockpile rather than dropping", () => {
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
        assert.deepStrictEqual(actions, [
            { type: "depositToStockpile", stockpileId: stockpile.id },
        ]);
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

    it("expand drops on a free tile, not the obstacle the worker stands on", () => {
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
        building.worldPosition = { x: 10, y: 6 };

        const worker = createWorker(settlement);
        worker.worldPosition = { x: 10, y: 6 };
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 3;

        const behavior = createDepositHeldBehavior();
        const actions = behavior.expand(worker);

        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].type, "dropHeld");
        const drop = actions[0] as { destination: { x: number; y: number } };
        assert.notDeepStrictEqual(
            drop.destination,
            { x: 10, y: 6 },
            "the building's tile cannot take a pile, so the drop lands beside it",
        );
    });
});
