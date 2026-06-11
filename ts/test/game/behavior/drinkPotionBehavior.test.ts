import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createDrinkPotionBehavior,
    choosePotionIds,
    GREATER_POTION_MISSING_HP,
} from "../../../src/game/behavior/behaviors/drinkPotionBehavior.ts";
import {
    createInventoryComponent,
    addInventoryItem,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../src/game/component/heldItemComponent.ts";
import { createHealthComponent } from "../../../src/game/component/healthComponent.ts";
import {
    addThreat,
    createThreatMapComponent,
    ThreatMapComponentId,
} from "../../../src/game/component/threatMapComponent.ts";
import { createStockpileComponent } from "../../../src/game/component/stockpileComponent.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import type { InventoryItem } from "../../../src/data/inventory/inventoryItem.ts";
import {
    greaterHealthPotion,
    healthPotion,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

function createSettlement(id = "settlement"): Entity {
    const settlement = new Entity(id);
    settlement.setEcsComponent(createPlayerKingdomComponent());
    return settlement;
}

function createWorker(
    settlement: Entity,
    currentHp = 90,
    maxHp = 200,
): Entity {
    const worker = new Entity("worker");
    settlement.addChild(worker);
    worker.worldPosition = { x: 12, y: 8 };
    worker.setEcsComponent(createHeldItemComponent());
    worker.setEcsComponent(createHealthComponent(currentHp, maxHp));
    worker.setEcsComponent(createThreatMapComponent());
    return worker;
}

function createStockpileWithItems(
    id: string,
    parent: Entity,
    items: { item: InventoryItem; amount: number }[],
    position = { x: 15, y: 8 },
): Entity {
    const stockpile = new Entity(id);
    parent.addChild(stockpile);
    stockpile.worldPosition = position;
    stockpile.setEcsComponent(createStockpileComponent());
    const inv = createInventoryComponent();
    for (const stack of items) {
        addInventoryItem(inv, stack.item, stack.amount);
    }
    stockpile.setEcsComponent(inv);
    return stockpile;
}

describe("drinkPotionBehavior", () => {
    describe("isValid", () => {
        it("returns true below half health", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 99, 200);
            assert.strictEqual(behavior.isValid(worker), true);
        });

        it("returns false at exactly half health", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 100, 200);
            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns false without a health component", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = new Entity("worker");
            settlement.addChild(worker);
            worker.setEcsComponent(createHeldItemComponent());
            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns false while a live attacker has threat", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 50, 200);
            const attacker = new Entity("G1");
            attacker.worldPosition = { x: 13, y: 8 };
            settlement.addChild(attacker);
            const threat = worker.requireEcsComponent(ThreatMapComponentId);
            addThreat(threat, "G1", 5, 0);

            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns true when the top threat no longer exists", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 50, 200);
            const threat = worker.requireEcsComponent(ThreatMapComponentId);
            addThreat(threat, "slainGoblin", 5, 0);

            assert.strictEqual(behavior.isValid(worker), true);
        });
    });

    describe("utility", () => {
        it("returns 0 at or above half health", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 100, 200);
            assert.strictEqual(behavior.utility(worker), 0);
        });

        it("starts around 50 just below the threshold", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 99, 200);
            const utility = behavior.utility(worker);
            assert.ok(utility >= 50 && utility < 55);
        });

        it("increases as health drops", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const workerHurt = createWorker(settlement, 90, 200);
            const workerDying = createWorker(settlement, 20, 200);
            assert.ok(
                behavior.utility(workerDying) > behavior.utility(workerHurt),
            );
        });

        it("stays below combat utility (90) even near death", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 1, 200);
            assert.ok(behavior.utility(worker) <= 85);
        });
    });

    describe("choosePotionIds", () => {
        it("prefers the lesser potion below the greater cutoff", () => {
            const [preferred, fallback] = choosePotionIds(
                GREATER_POTION_MISSING_HP - 1,
            );
            assert.strictEqual(preferred, healthPotion.id);
            assert.strictEqual(fallback, greaterHealthPotion.id);
        });

        it("prefers the greater potion at the cutoff", () => {
            const [preferred, fallback] = choosePotionIds(
                GREATER_POTION_MISSING_HP,
            );
            assert.strictEqual(preferred, greaterHealthPotion.id);
            assert.strictEqual(fallback, healthPotion.id);
        });
    });

    describe("expand", () => {
        it("drinks directly when holding a potion", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 90, 200);
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = healthPotion;
            held.amount = 1;
            createStockpileWithItems("stockpile", settlement, [
                { item: healthPotion, amount: 3 },
            ]);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].type, "drinkFromHeld");
        });

        it("deposits a held non-potion item before fetching", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 90, 200);
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 4;
            createStockpileWithItems("stockpile", settlement, [
                { item: healthPotion, amount: 3 },
            ]);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "depositToStockpile");
            assert.ok(actions.some((a) => a.type === "drinkFromHeld"));
        });

        it("fetches from a stockpile when held is empty", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 90, 200);
            createStockpileWithItems("stockpile", settlement, [
                { item: healthPotion, amount: 3 },
            ]);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "withdrawFromStockpile");
            assert.strictEqual(
                (actions[1] as { itemId: string }).itemId,
                healthPotion.id,
            );
            assert.strictEqual(actions[2].type, "drinkFromHeld");
        });

        it("withdraws the greater potion when missing hp reaches the cutoff", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 50, 200);
            createStockpileWithItems("stockpile", settlement, [
                { item: healthPotion, amount: 3 },
                { item: greaterHealthPotion, amount: 1 },
            ]);

            const actions = behavior.expand(worker);
            assert.strictEqual(
                (actions[1] as { itemId: string }).itemId,
                greaterHealthPotion.id,
            );
        });

        it("withdraws the lesser potion for smaller wounds even when both are stocked", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 90, 200);
            createStockpileWithItems("stockpile", settlement, [
                { item: healthPotion, amount: 3 },
                { item: greaterHealthPotion, amount: 1 },
            ]);

            const actions = behavior.expand(worker);
            assert.strictEqual(
                (actions[1] as { itemId: string }).itemId,
                healthPotion.id,
            );
        });

        it("falls back to the other tier when the preferred one is out of stock", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 50, 200);
            createStockpileWithItems("stockpile", settlement, [
                { item: healthPotion, amount: 3 },
            ]);

            const actions = behavior.expand(worker);
            assert.strictEqual(
                (actions[1] as { itemId: string }).itemId,
                healthPotion.id,
            );
        });

        it("picks the nearest stockpile holding the preferred tier", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 90, 200);
            createStockpileWithItems(
                "farStockpile",
                settlement,
                [{ item: healthPotion, amount: 3 }],
                { x: 30, y: 8 },
            );
            createStockpileWithItems(
                "nearStockpile",
                settlement,
                [{ item: healthPotion, amount: 3 }],
                { x: 14, y: 8 },
            );

            const actions = behavior.expand(worker);
            assert.strictEqual(
                (actions[1] as { stockpileId: string }).stockpileId,
                "nearStockpile",
            );
        });

        it("returns empty when no potions are stocked anywhere", () => {
            const behavior = createDrinkPotionBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 90, 200);
            createStockpileWithItems("stockpile", settlement, [
                { item: woodResourceItem, amount: 10 },
            ]);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 0);
        });
    });
});
