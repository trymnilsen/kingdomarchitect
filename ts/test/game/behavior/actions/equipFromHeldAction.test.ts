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
import { createStatsComponent } from "../../../../src/game/component/statsComponent.ts";
import { executeEquipFromHeldAction } from "../../../../src/game/behavior/actions/equipFromHeldAction.ts";
import { swordItem } from "../../../../src/data/inventory/items/equipment.ts";

function createWorker(): Entity {
    const worker = new Entity("worker");
    worker.setEcsComponent(createEquipmentComponent());
    worker.setEcsComponent(createHeldItemComponent());
    worker.setEcsComponent(createStatsComponent());
    return worker;
}

describe("equipFromHeldAction", () => {
    it("moves single held item into the requested slot and clears held", () => {
        const worker = createWorker();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = swordItem;
        held.amount = 1;

        const result = executeEquipFromHeldAction(
            { type: "equipFromHeld", slot: "primary" },
            worker,
        );
        assert.strictEqual(result.kind, "complete");

        const equipment = worker.requireEcsComponent(EquipmentComponentId);
        assert.strictEqual(equipment.slots.primary?.id, swordItem.id);
        assert.strictEqual(held.item, null);
        assert.strictEqual(held.amount, 0);
    });

    it("fails when held is empty", () => {
        const worker = createWorker();
        const result = executeEquipFromHeldAction(
            { type: "equipFromHeld", slot: "primary" },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
    });

    it("fails when held amount is not exactly 1", () => {
        const worker = createWorker();
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = swordItem;
        held.amount = 2;

        const result = executeEquipFromHeldAction(
            { type: "equipFromHeld", slot: "primary" },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
        assert.strictEqual(held.amount, 2);
    });

    it("fails when target slot is occupied", () => {
        const worker = createWorker();
        const equipment = worker.requireEcsComponent(EquipmentComponentId);
        equipment.slots.primary = swordItem;
        const held = worker.requireEcsComponent(HeldItemComponentId);
        held.item = swordItem;
        held.amount = 1;

        const result = executeEquipFromHeldAction(
            { type: "equipFromHeld", slot: "primary" },
            worker,
        );
        assert.strictEqual(result.kind, "failed");
    });
});
