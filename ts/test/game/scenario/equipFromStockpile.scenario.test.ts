import assert from "node:assert";
import { describe, it } from "node:test";
import { ScenarioHarness } from "./scenarioHarness.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { EquipmentComponentId } from "../../../src/game/component/equipmentComponent.ts";
import { HeldItemComponentId } from "../../../src/game/component/heldItemComponent.ts";
import { BehaviorAgentComponentId } from "../../../src/game/component/BehaviorAgentComponent.ts";
import {
    swordItem,
    hammerItem,
} from "../../../src/data/inventory/items/equipment.ts";
import { woodResourceItem } from "../../../src/data/inventory/items/resources.ts";
import { CollectableComponentId } from "../../../src/game/component/collectableComponent.ts";
import { GroundItemComponentId } from "../../../src/game/component/groundItemComponent.ts";
import type { Entity } from "../../../src/game/entity/entity.ts";

function setEquipPlayerCommand(
    worker: Entity,
    sourceId: string,
    itemId: string,
    slot: "primary" | "secondary",
): void {
    const agent = worker.requireEcsComponent(BehaviorAgentComponentId);
    agent.playerCommand = {
        action: "equip",
        sourceEntityId: sourceId,
        itemId,
        slot,
    };
    agent.pendingReplan = { kind: "replan" };
    worker.invalidateComponent(BehaviorAgentComponentId);
}

function findGroundPiles(root: Entity): Entity[] {
    const piles: Entity[] = [];
    for (const [entity] of root.queryComponents(GroundItemComponentId)) {
        piles.push(entity);
    }
    return piles;
}

function findGroundPileWithItem(root: Entity, itemId: string): Entity | null {
    for (const pile of findGroundPiles(root)) {
        const collectable = pile.getEcsComponent(CollectableComponentId);
        if (!collectable) continue;
        if (collectable.items.some((s) => s.item.id === itemId)) {
            return pile;
        }
    }
    return null;
}

describe("equip from stockpile scenario", () => {
    it("worker walks to stockpile and equips a sword to an empty slot", () => {
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 10, y: 8 });
        const stockpile = harness.addStockpile("stockpile", { x: 14, y: 8 });

        const stockpileInv =
            stockpile.requireEcsComponent(InventoryComponentId);
        addInventoryItem(stockpileInv, swordItem, 1);

        // Sanity: worker's primary slot starts empty.
        const equipment = worker.requireEcsComponent(EquipmentComponentId);
        assert.strictEqual(equipment.slots.primary, null);

        setEquipPlayerCommand(worker, stockpile.id, swordItem.id, "primary");

        const elapsed = harness.tickUntil((root) => {
            const e = root
                .findEntity("worker")
                ?.requireEcsComponent(EquipmentComponentId);
            return e?.slots.primary?.id === swordItem.id;
        }, 60);

        const finalEquipment = worker.requireEcsComponent(EquipmentComponentId);
        assert.strictEqual(
            finalEquipment.slots.primary?.id,
            swordItem.id,
            `Worker should have sword in primary slot (elapsed: ${elapsed} ticks)`,
        );

        // Stockpile gave up its sword.
        const remaining = stockpileInv.items.find(
            (s) => s.item.id === swordItem.id,
        );
        assert.ok(
            !remaining || remaining.amount === 0,
            "Stockpile should no longer hold the equipped sword",
        );
    });
});

describe("equip with displacement scenario", () => {
    it("worker carrying wood with old sword equipped: drops both, equips new sword", () => {
        const harness = new ScenarioHarness();
        const worker = harness.addWorker("worker", { x: 10, y: 8 });
        const stockpile = harness.addStockpile("stockpile", { x: 14, y: 8 });

        const stockpileInv =
            stockpile.requireEcsComponent(InventoryComponentId);
        addInventoryItem(stockpileInv, swordItem, 1);

        // Pre-state: worker holding wood, hammer in primary slot.
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 5;
        const equipment = worker.requireEcsComponent(EquipmentComponentId);
        equipment.slots.primary = hammerItem;

        setEquipPlayerCommand(worker, stockpile.id, swordItem.id, "primary");

        // Sword in primary, plus piles in the world for the displaced wood
        // and hammer.
        const elapsed = harness.tickUntil(
            () => equipment.slots.primary?.id === swordItem.id,
            120,
        );

        assert.strictEqual(
            equipment.slots.primary?.id,
            swordItem.id,
            `Sword should be equipped (elapsed: ${elapsed} ticks)`,
        );

        const woodPile = findGroundPileWithItem(harness.root, "wood");
        assert.ok(woodPile, "Displaced wood should exist as a ground pile");
        const woodCollectable = woodPile.requireEcsComponent(
            CollectableComponentId,
        );
        const woodStack = woodCollectable.items.find(
            (s) => s.item.id === "wood",
        );
        assert.ok(woodStack);
        assert.strictEqual(
            woodStack.amount,
            5,
            "Wood pile should contain the full 5 dropped from held",
        );

        const hammerPile = findGroundPileWithItem(harness.root, hammerItem.id);
        assert.ok(hammerPile, "Displaced hammer should exist as a ground pile");
        const hammerCollectable = hammerPile.requireEcsComponent(
            CollectableComponentId,
        );
        const hammerStack = hammerCollectable.items.find(
            (s) => s.item.id === hammerItem.id,
        );
        assert.ok(hammerStack);
        assert.strictEqual(hammerStack.amount, 1);

        // Held should be empty after the equip completes (sword went into slot).
        assert.strictEqual(
            held.item,
            null,
            "Held should be empty after the new sword has been equipped",
        );
    });
});
