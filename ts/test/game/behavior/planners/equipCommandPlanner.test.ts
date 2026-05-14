import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createEquipmentComponent,
    EquipmentComponentId,
} from "../../../../src/game/component/equipmentComponent.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    createInventoryComponent,
    addInventoryItem,
} from "../../../../src/game/component/inventoryComponent.ts";
import { createStockpileComponent } from "../../../../src/game/component/stockpileComponent.ts";
import { createGroundItemComponent } from "../../../../src/game/component/groundItemComponent.ts";
import { createCollectableComponent } from "../../../../src/game/component/collectableComponent.ts";
import { planEquipCommand } from "../../../../src/game/behavior/planners/equipCommandPlanner.ts";
import {
    swordItem,
    hammerItem,
} from "../../../../src/data/inventory/items/equipment.ts";
import { woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";
import { createMinimalWorld } from "../../testWorld.ts";
import type { BehaviorActionData } from "../../../../src/game/behavior/actions/ActionData.ts";

type ActionType = BehaviorActionData["type"];

function createScene(): {
    root: Entity;
    worker: Entity;
    stockpile: Entity;
} {
    const { root } = createMinimalWorld();
    const worker = new Entity("worker");
    worker.setEcsComponent(createEquipmentComponent());
    worker.setEcsComponent(createHeldItemComponent());
    root.addChild(worker);
    worker.worldPosition = { x: 5, y: 5 };

    const stockpile = new Entity("stockpile");
    stockpile.setEcsComponent(createStockpileComponent());
    const inv = createInventoryComponent();
    addInventoryItem(inv, swordItem, 3);
    stockpile.setEcsComponent(inv);
    root.addChild(stockpile);
    stockpile.worldPosition = { x: 8, y: 5 };

    return { root, worker, stockpile };
}

function actionTypes(actions: BehaviorActionData[]): ActionType[] {
    return actions.map((a) => a.type);
}

describe("equipCommandPlanner", () => {
    describe("matrix: held state × slot occupancy", () => {
        it("held empty + slot empty → fetch + equip (no displacement)", () => {
            const { root, worker } = createScene();
            const actions = planEquipCommand(root, worker, {
                sourceEntityId: "stockpile",
                itemId: swordItem.id,
                slot: "primary",
            });
            assert.deepStrictEqual(actionTypes(actions), [
                "moveTo",
                "withdrawFromStockpile",
                "equipFromHeld",
                "clearPlayerCommand",
            ]);
        });

        it("held same id + slot empty → fetch + equip (no displacement)", () => {
            const { root, worker } = createScene();
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = swordItem;
            held.amount = 1;
            const actions = planEquipCommand(root, worker, {
                sourceEntityId: "stockpile",
                itemId: swordItem.id,
                slot: "primary",
            });
            assert.deepStrictEqual(actionTypes(actions), [
                "moveTo",
                "withdrawFromStockpile",
                "equipFromHeld",
                "clearPlayerCommand",
            ]);
        });

        it("held different id + slot empty → drop held + fetch + equip", () => {
            const { root, worker } = createScene();
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 4;
            const actions = planEquipCommand(root, worker, {
                sourceEntityId: "stockpile",
                itemId: swordItem.id,
                slot: "primary",
            });
            assert.deepStrictEqual(actionTypes(actions), [
                "moveTo",
                "dropHeld",
                "moveTo",
                "withdrawFromStockpile",
                "equipFromHeld",
                "clearPlayerCommand",
            ]);
        });

        it("held empty + slot occupied → drop slot + fetch + equip", () => {
            const { root, worker } = createScene();
            const equipment = worker.requireEcsComponent(EquipmentComponentId);
            equipment.slots.primary = hammerItem;
            const actions = planEquipCommand(root, worker, {
                sourceEntityId: "stockpile",
                itemId: swordItem.id,
                slot: "primary",
            });
            assert.deepStrictEqual(actionTypes(actions), [
                "moveTo",
                "dropFromSlot",
                "moveTo",
                "withdrawFromStockpile",
                "equipFromHeld",
                "clearPlayerCommand",
            ]);
        });

        it("held same id + slot occupied → drop slot + fetch + equip (held untouched)", () => {
            const { root, worker } = createScene();
            const equipment = worker.requireEcsComponent(EquipmentComponentId);
            equipment.slots.primary = hammerItem;
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = swordItem;
            held.amount = 1;
            const actions = planEquipCommand(root, worker, {
                sourceEntityId: "stockpile",
                itemId: swordItem.id,
                slot: "primary",
            });
            assert.deepStrictEqual(actionTypes(actions), [
                "moveTo",
                "dropFromSlot",
                "moveTo",
                "withdrawFromStockpile",
                "equipFromHeld",
                "clearPlayerCommand",
            ]);
        });

        it("held different id + slot occupied → drop held + drop slot + fetch + equip", () => {
            const { root, worker } = createScene();
            const equipment = worker.requireEcsComponent(EquipmentComponentId);
            equipment.slots.primary = hammerItem;
            const held = worker.requireEcsComponent(HeldItemComponentId);
            held.item = woodResourceItem;
            held.amount = 4;
            const actions = planEquipCommand(root, worker, {
                sourceEntityId: "stockpile",
                itemId: swordItem.id,
                slot: "primary",
            });
            assert.deepStrictEqual(actionTypes(actions), [
                "moveTo",
                "dropHeld",
                "moveTo",
                "dropFromSlot",
                "moveTo",
                "withdrawFromStockpile",
                "equipFromHeld",
                "clearPlayerCommand",
            ]);
        });
    });

    describe("source discrimination", () => {
        it("uses pickupFromGround when source is a ground pile", () => {
            const { root, worker } = createScene();
            const pile = new Entity("ground-pile");
            pile.setEcsComponent(createGroundItemComponent());
            const collectable = createCollectableComponent([
                { item: swordItem, amount: 1 },
            ]);
            pile.setEcsComponent(collectable);
            root.addChild(pile);
            pile.worldPosition = { x: 9, y: 5 };

            const actions = planEquipCommand(root, worker, {
                sourceEntityId: "ground-pile",
                itemId: swordItem.id,
                slot: "primary",
            });
            assert.deepStrictEqual(actionTypes(actions), [
                "moveTo",
                "pickupFromGround",
                "equipFromHeld",
                "clearPlayerCommand",
            ]);
        });
    });

    describe("error cases", () => {
        it("returns empty plan when source entity is missing", () => {
            const { root, worker } = createScene();
            const actions = planEquipCommand(root, worker, {
                sourceEntityId: "nonexistent",
                itemId: swordItem.id,
                slot: "primary",
            });
            assert.deepStrictEqual(actions, []);
        });

        it("throws when source is neither stockpile nor ground pile", () => {
            const { root, worker } = createScene();
            const oddSource = new Entity("odd-source");
            root.addChild(oddSource);
            oddSource.worldPosition = { x: 7, y: 5 };

            assert.throws(() =>
                planEquipCommand(root, worker, {
                    sourceEntityId: "odd-source",
                    itemId: swordItem.id,
                    slot: "primary",
                }),
            );
        });

        it("throws on unknown itemId", () => {
            const { root, worker } = createScene();
            assert.throws(() =>
                planEquipCommand(root, worker, {
                    sourceEntityId: "stockpile",
                    itemId: "not-a-real-item",
                    slot: "primary",
                }),
            );
        });
    });
});
