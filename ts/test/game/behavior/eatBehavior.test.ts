import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createEatBehavior,
    HUNGER_THRESHOLD,
    STEAL_THRESHOLD,
} from "../../../src/game/behavior/behaviors/eatBehavior.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import {
    createHungerComponent,
    HungerComponentId,
} from "../../../src/game/component/hungerComponent.ts";
import { createStockpileComponent } from "../../../src/game/component/stockpileComponent.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import {
    breadItem,
    berryItem,
    wheatResourceItem,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";
import { createDesiredInventoryComponent } from "../../../src/game/component/desiredInventoryComponent.ts";

function createSettlement(id = "settlement"): Entity {
    const settlement = new Entity(id);
    settlement.setEcsComponent(createPlayerKingdomComponent());
    return settlement;
}

function createWorker(settlement: Entity, hunger = 60): Entity {
    const worker = new Entity("worker");
    settlement.addChild(worker);
    worker.worldPosition = { x: 12, y: 8 };
    worker.setEcsComponent(createInventoryComponent());
    worker.setEcsComponent(createHungerComponent(hunger, 0.1));
    return worker;
}

function createStockpileWithFood(id: string, parent: Entity, amount = 5): Entity {
    const stockpile = new Entity(id);
    parent.addChild(stockpile);
    stockpile.worldPosition = { x: 15, y: 8 };
    stockpile.setEcsComponent(createStockpileComponent());
    const inv = createInventoryComponent();
    addInventoryItem(inv, breadItem, amount);
    stockpile.setEcsComponent(inv);
    return stockpile;
}

describe("eatBehavior", () => {
    describe("isValid", () => {
        it("returns false without HungerComponent", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = new Entity("worker");
            settlement.addChild(worker);
            worker.setEcsComponent(createInventoryComponent());

            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns false when hunger is below 40", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, HUNGER_THRESHOLD - 10);

            assert.strictEqual(behavior.isValid(worker), false);
        });

        it("returns true when hunger is exactly 40", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, HUNGER_THRESHOLD);

            assert.strictEqual(behavior.isValid(worker), true);
        });

        it("returns true when hunger is above 40", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, HUNGER_THRESHOLD + 30);

            assert.strictEqual(behavior.isValid(worker), true);
        });
    });

    describe("utility", () => {
        it("returns 0 when hunger is below 40", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, HUNGER_THRESHOLD - 20);

            assert.strictEqual(behavior.utility(worker), 0);
        });

        it("increases as hunger increases above threshold", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const workerMild = createWorker(settlement, 50);
            const workerHungry = createWorker(settlement, 80);

            assert.ok(
                behavior.utility(workerHungry) > behavior.utility(workerMild),
                "higher hunger should give higher utility",
            );
        });

        it("exceeds performJob utility (~50) at moderate hunger (~60)", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);

            assert.ok(
                behavior.utility(worker) > 50,
                "utility at hunger=60 should exceed 50 (performJob baseline)",
            );
        });

        it("stays below player command utility (~90) even at maximum hunger", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 100);

            assert.ok(
                behavior.utility(worker) < 90,
                "utility should stay below player command utility even at max hunger",
            );
        });
    });

    describe("expand stage priority", () => {
        it("returns eatFromInventory when food is in inventory even if stockpile also available", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);
            addInventoryItem(worker.getEcsComponent(InventoryComponentId)!, breadItem, 1);
            createStockpileWithFood("stockpile", settlement);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].type, "eatFromInventory");
        });

        it("returns moveTo + withdrawFromStockpile + eatFromInventory when inventory has no food but stockpile does", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);
            createStockpileWithFood("stockpile", settlement);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "withdrawFromStockpile");
            assert.strictEqual(actions[2].type, "eatFromInventory");
        });

        it("returns moveTo + harvestResource + eatFromInventory when no stockpile food but forageable resource exists", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            // No settlement — worker is in root directly (falls back to root)
            const worker = new Entity("worker");
            root.addChild(worker);
            worker.worldPosition = { x: 12, y: 8 };
            worker.setEcsComponent(createInventoryComponent());
            worker.setEcsComponent(createHungerComponent(60, 0.1));

            const berry = new Entity("berryBush");
            root.addChild(berry);
            berry.worldPosition = { x: 14, y: 8 };
            berry.setEcsComponent(createResourceComponent("berrybush"));

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "harvestResource");
            assert.strictEqual(actions[2].type, "eatFromInventory");
        });

        it("returns moveTo + stealFood + eatFromInventory when hunger >= 80, no other food, nearby unit has food", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            const thief = new Entity("thief");
            root.addChild(thief);
            thief.worldPosition = { x: 12, y: 8 };
            thief.setEcsComponent(createInventoryComponent());
            thief.setEcsComponent(createHungerComponent(STEAL_THRESHOLD, 0.1));

            const victim = new Entity("victim");
            root.addChild(victim);
            victim.worldPosition = { x: 14, y: 8 };
            const victimInv = createInventoryComponent();
            addInventoryItem(victimInv, breadItem, 2);
            victim.setEcsComponent(victimInv);

            const actions = behavior.expand(thief);
            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "stealFood");
            assert.strictEqual(actions[2].type, "eatFromInventory");
        });

        it("does not return stealFood when hunger is below 80", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            const thief = new Entity("thief");
            root.addChild(thief);
            thief.worldPosition = { x: 12, y: 8 };
            thief.setEcsComponent(createInventoryComponent());
            thief.setEcsComponent(createHungerComponent(STEAL_THRESHOLD - 10, 0.1));

            const victim = new Entity("victim");
            root.addChild(victim);
            victim.worldPosition = { x: 14, y: 8 };
            const victimInv = createInventoryComponent();
            addInventoryItem(victimInv, breadItem, 2);
            victim.setEcsComponent(victimInv);

            const actions = behavior.expand(thief);
            assert.strictEqual(actions.length, 0, "should not steal when hunger < 80");
        });

        it("uses stockpile food the worker doesn't have a desired entry for", () => {
            // Regression: previously, a worker with desired=[bread] would lock the
            // stockpile lookup to bread and bail to forage when only wheat was stocked.
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);
            worker.setEcsComponent(
                createDesiredInventoryComponent([
                    { itemId: breadItem.id, amount: 2 },
                ]),
            );

            const stockpile = new Entity("stockpile");
            settlement.addChild(stockpile);
            stockpile.worldPosition = { x: 15, y: 8 };
            stockpile.setEcsComponent(createStockpileComponent());
            const inv = createInventoryComponent();
            addInventoryItem(inv, wheatResourceItem, 5);
            stockpile.setEcsComponent(inv);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "withdrawFromStockpile");
            assert.strictEqual(
                (actions[1] as { itemId: string }).itemId,
                wheatResourceItem.id,
            );
            assert.strictEqual(actions[2].type, "eatFromInventory");
        });

        it("returns empty when no food source exists", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            const worker = new Entity("worker");
            root.addChild(worker);
            worker.worldPosition = { x: 12, y: 8 };
            worker.setEcsComponent(createInventoryComponent());
            worker.setEcsComponent(createHungerComponent(90, 0.1));

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 0);
        });
    });
});
