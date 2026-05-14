import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createHeldItemComponent,
    HeldItemComponentId,
} from "../../../../src/game/component/heldItemComponent.ts";
import {
    createHungerComponent,
    HungerComponentId,
} from "../../../../src/game/component/hungerComponent.ts";
import { executeEatFromHeldAction } from "../../../../src/game/behavior/actions/eatFromHeldAction.ts";
import {
    breadItem,
    woodResourceItem,
} from "../../../../src/data/inventory/items/resources.ts";

function createTestEntity(): Entity {
    const entity = new Entity("worker");
    entity.worldPosition = { x: 12, y: 8 };
    entity.setEcsComponent(createHeldItemComponent());
    entity.setEcsComponent(createHungerComponent(60, 0.1));
    return entity;
}

describe("eatFromHeldAction", () => {
    it("reduces hunger when held has a food-tagged item", () => {
        const entity = createTestEntity();
        const held = entity.requireEcsComponent(HeldItemComponentId);
        held.item = breadItem;
        held.amount = 1;

        const result = executeEatFromHeldAction({ type: "eatFromHeld" }, entity);
        assert.strictEqual(result.kind, "complete");

        const hunger = entity.getEcsComponent(HungerComponentId)!;
        assert.strictEqual(hunger.hunger, 30);
    });

    it("decrements held amount and clears when stack drains", () => {
        const entity = createTestEntity();
        const held = entity.requireEcsComponent(HeldItemComponentId);
        held.item = breadItem;
        held.amount = 3;

        executeEatFromHeldAction({ type: "eatFromHeld" }, entity);
        assert.strictEqual(held.amount, 2);

        executeEatFromHeldAction({ type: "eatFromHeld" }, entity);
        executeEatFromHeldAction({ type: "eatFromHeld" }, entity);
        assert.strictEqual(held.item, null);
        assert.strictEqual(held.amount, 0);
    });

    it("returns failed when held is empty", () => {
        const entity = createTestEntity();
        const result = executeEatFromHeldAction({ type: "eatFromHeld" }, entity);
        assert.strictEqual(result.kind, "failed");
    });

    it("returns failed when held holds a non-food item", () => {
        const entity = createTestEntity();
        const held = entity.requireEcsComponent(HeldItemComponentId);
        held.item = woodResourceItem;
        held.amount = 5;

        const result = executeEatFromHeldAction({ type: "eatFromHeld" }, entity);
        assert.strictEqual(result.kind, "failed");
        assert.strictEqual(held.amount, 5, "wood should be untouched");
    });
});
