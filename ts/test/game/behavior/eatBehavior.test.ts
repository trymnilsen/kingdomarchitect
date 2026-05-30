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
} from "../../../src/game/component/inventoryComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../src/game/component/heldItemComponent.ts";
import {
    createEquipmentComponent,
    EquipmentComponentId,
} from "../../../src/game/component/equipmentComponent.ts";
import { createHungerComponent } from "../../../src/game/component/hungerComponent.ts";
import { createStockpileComponent } from "../../../src/game/component/stockpileComponent.ts";
import { createResourceComponent } from "../../../src/game/component/resourceComponent.ts";
import { createPlayerKingdomComponent } from "../../../src/game/component/playerKingdomComponent.ts";
import {
    breadItem,
    woodResourceItem,
} from "../../../src/data/inventory/items/resources.ts";

function createSettlement(id = "settlement"): Entity {
    const settlement = new Entity(id);
    settlement.setEcsComponent(createPlayerKingdomComponent());
    return settlement;
}

function createWorker(settlement: Entity, hunger = 60): Entity {
    const worker = new Entity("worker");
    settlement.addChild(worker);
    worker.worldPosition = { x: 12, y: 8 };
    worker.setEcsComponent(createHeldItemComponent());
    worker.setEcsComponent(createEquipmentComponent());
    worker.setEcsComponent(createHungerComponent(hunger, 0.1));
    return worker;
}

function createStockpileWithFood(
    id: string,
    parent: Entity,
    amount = 5,
): Entity {
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
            );
        });

        it("stays below player command utility (~90) even at max hunger", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 100);
            assert.ok(behavior.utility(worker) < 90);
        });
    });

    describe("expand stage priority", () => {
        it("returns eatFromEquipment when food is in an equipment slot", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);
            const equipment = worker.requireEcsComponent(EquipmentComponentId);
            equipment.slots.secondary = breadItem;
            createStockpileWithFood("stockpile", settlement);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].type, "eatFromEquipment");
            assert.strictEqual(
                (actions[0] as { slot: string }).slot,
                "secondary",
            );
        });

        it("returns eatFromHeld when held has food (no equipment food)", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = breadItem;
            held.amount = 1;
            createStockpileWithFood("stockpile", settlement);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].type, "eatFromHeld");
        });

        it("returns moveTo + withdrawFromStockpile + eatFromHeld when held empty but stockpile has food", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);
            createStockpileWithFood("stockpile", settlement);

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "withdrawFromStockpile");
            assert.strictEqual(actions[2].type, "eatFromHeld");
        });

        it("returns moveTo + harvestResource + eatFromHeld when only forageable is available", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            const worker = new Entity("worker");
            root.addChild(worker);
            worker.worldPosition = { x: 12, y: 8 };
            worker.setEcsComponent(createHeldItemComponent());
            worker.setEcsComponent(createEquipmentComponent());
            worker.setEcsComponent(createHungerComponent(60, 0.1));

            const berry = new Entity("berryBush");
            root.addChild(berry);
            berry.worldPosition = { x: 14, y: 8 };
            berry.setEcsComponent(createResourceComponent("berrybush"));

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 3);
            assert.strictEqual(actions[0].type, "moveTo");
            assert.strictEqual(actions[1].type, "harvestResource");
            assert.strictEqual(actions[2].type, "eatFromHeld");
        });

        it("returns moveTo + stealFood + eatFromHeld at hunger >= 80", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            const thief = new Entity("thief");
            root.addChild(thief);
            thief.worldPosition = { x: 12, y: 8 };
            thief.setEcsComponent(createHeldItemComponent());
            thief.setEcsComponent(createEquipmentComponent());
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
            assert.strictEqual(actions[2].type, "eatFromHeld");
        });

        it("does not return stealFood when hunger is below 80", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            const thief = new Entity("thief");
            root.addChild(thief);
            thief.worldPosition = { x: 12, y: 8 };
            thief.setEcsComponent(createHeldItemComponent());
            thief.setEcsComponent(createEquipmentComponent());
            thief.setEcsComponent(
                createHungerComponent(STEAL_THRESHOLD - 10, 0.1),
            );

            const victim = new Entity("victim");
            root.addChild(victim);
            victim.worldPosition = { x: 14, y: 8 };
            const victimInv = createInventoryComponent();
            addInventoryItem(victimInv, breadItem, 2);
            victim.setEcsComponent(victimInv);

            const actions = behavior.expand(thief);
            assert.strictEqual(actions.length, 0);
        });

        it("ignores non-food held items", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 5;

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 0);
        });

        it("returns empty when no food source exists", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            const worker = new Entity("worker");
            root.addChild(worker);
            worker.worldPosition = { x: 12, y: 8 };
            worker.setEcsComponent(createHeldItemComponent());
            worker.setEcsComponent(createEquipmentComponent());
            worker.setEcsComponent(createHungerComponent(90, 0.1));

            const actions = behavior.expand(worker);
            assert.strictEqual(actions.length, 0);
        });
    });

    describe("clearing a held non-food item before eating", () => {
        it("deposits the held item at a stockpile before fetching food", () => {
            const behavior = createEatBehavior();
            const settlement = createSettlement();
            const worker = createWorker(settlement, 60);
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 4;
            // Preference-less stockpile accepts the wood and also holds the food.
            createStockpileWithFood("stockpile", settlement);

            const actions = behavior.expand(worker);

            assert.strictEqual(
                actions[0].type,
                "moveTo",
                "first walk to the stockpile to drop the load",
            );
            assert.strictEqual(
                actions[1].type,
                "depositToStockpile",
                "deposit the carried wood rather than dropping it",
            );
            assert.ok(
                actions.some((a) => a.type === "eatFromHeld"),
                "still proceeds to eat after depositing",
            );
        });

        it("drops the held item only when no stockpile will accept it", () => {
            const behavior = createEatBehavior();
            const root = new Entity("root");
            const worker = new Entity("worker");
            root.addChild(worker);
            worker.worldPosition = { x: 12, y: 8 };
            worker.setEcsComponent(createHeldItemComponent());
            worker.setEcsComponent(createEquipmentComponent());
            worker.setEcsComponent(createHungerComponent(60, 0.1));
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 4;

            // A forageable food source but no stockpile anywhere.
            const berry = new Entity("berryBush");
            root.addChild(berry);
            berry.worldPosition = { x: 14, y: 8 };
            berry.setEcsComponent(createResourceComponent("berrybush"));

            const actions = behavior.expand(worker);

            assert.strictEqual(
                actions[0].type,
                "dropHeld",
                "falls back to dropping when no stockpile accepts the item",
            );
            assert.ok(actions.some((a) => a.type === "eatFromHeld"));
        });
    });
});
