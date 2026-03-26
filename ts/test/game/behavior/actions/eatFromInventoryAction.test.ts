import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import {
    createHungerComponent,
    HungerComponentId,
} from "../../../../src/game/component/hungerComponent.ts";
import { executeEatFromInventoryAction } from "../../../../src/game/behavior/actions/eatFromInventoryAction.ts";
import { breadItem, woodResourceItem } from "../../../../src/data/inventory/items/resources.ts";

function createTestEntity(): Entity {
    const entity = new Entity("worker");
    entity.worldPosition = { x: 12, y: 8 };
    entity.setEcsComponent(createInventoryComponent());
    entity.setEcsComponent(createHungerComponent(60, 0.1));
    return entity;
}

describe("eatFromInventoryAction", () => {
    it("reduces hunger when entity has a food-tagged item in inventory", () => {
        const entity = createTestEntity();
        addInventoryItem(entity.getEcsComponent(InventoryComponentId)!, breadItem, 1);

        const result = executeEatFromInventoryAction({ type: "eatFromInventory" }, entity);

        assert.strictEqual(result.kind, "complete");
        const hunger = entity.getEcsComponent(HungerComponentId)!;
        assert.strictEqual(hunger.hunger, 30); // 60 - 30
    });

    it("removes exactly one food item from inventory", () => {
        const entity = createTestEntity();
        addInventoryItem(entity.getEcsComponent(InventoryComponentId)!, breadItem, 3);

        executeEatFromInventoryAction({ type: "eatFromInventory" }, entity);

        const inventory = entity.getEcsComponent(InventoryComponentId)!;
        const stack = inventory.items.find((s) => s.item.id === breadItem.id);
        assert.ok(stack, "bread stack should still exist");
        assert.strictEqual(stack.amount, 2);
    });

    it("returns failed when inventory has no food-tagged items", () => {
        const entity = createTestEntity();

        const result = executeEatFromInventoryAction({ type: "eatFromInventory" }, entity);

        assert.strictEqual(result.kind, "failed");
    });

    it("does not consume non-food items in inventory", () => {
        const entity = createTestEntity();
        addInventoryItem(entity.getEcsComponent(InventoryComponentId)!, woodResourceItem, 5);

        const result = executeEatFromInventoryAction({ type: "eatFromInventory" }, entity);

        assert.strictEqual(result.kind, "failed");

        const inventory = entity.getEcsComponent(InventoryComponentId)!;
        const stack = inventory.items.find((s) => s.item.id === woodResourceItem.id);
        assert.ok(stack);
        assert.strictEqual(stack.amount, 5, "wood should be untouched");
    });
});
