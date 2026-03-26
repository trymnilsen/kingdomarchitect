import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    createInventoryComponent,
    addInventoryItem,
    InventoryComponentId,
} from "../../../../src/game/component/inventoryComponent.ts";
import { executeStealFoodAction } from "../../../../src/game/behavior/actions/stealFoodAction.ts";
import { breadItem } from "../../../../src/data/inventory/items/resources.ts";

function createTestScene(): { root: Entity; thief: Entity; target: Entity } {
    const root = new Entity("root");
    const thief = new Entity("thief");
    const target = new Entity("target");

    root.addChild(thief);
    root.addChild(target);

    thief.worldPosition = { x: 12, y: 8 };
    target.worldPosition = { x: 13, y: 8 }; // Adjacent

    thief.setEcsComponent(createInventoryComponent());

    const targetInventory = createInventoryComponent();
    addInventoryItem(targetInventory, breadItem, 3);
    target.setEcsComponent(targetInventory);

    return { root, thief, target };
}

describe("stealFoodAction", () => {
    it("transfers one food item from adjacent target to thief inventory", () => {
        const { thief, target } = createTestScene();
        const action = { type: "stealFood" as const, targetEntityId: "target" };

        const result = executeStealFoodAction(action, thief);

        assert.strictEqual(result.kind, "complete");

        const thiefInventory = thief.getEcsComponent(InventoryComponentId)!;
        const stolenStack = thiefInventory.items.find((s) => s.item.id === breadItem.id);
        assert.ok(stolenStack);
        assert.strictEqual(stolenStack.amount, 1);

        const targetInventory = target.getEcsComponent(InventoryComponentId)!;
        const remainingStack = targetInventory.items.find((s) => s.item.id === breadItem.id);
        assert.ok(remainingStack);
        assert.strictEqual(remainingStack.amount, 2);
    });

    it("returns failed when target entity does not exist", () => {
        const { thief } = createTestScene();
        const action = { type: "stealFood" as const, targetEntityId: "nonexistent" };

        const result = executeStealFoodAction(action, thief);

        assert.strictEqual(result.kind, "failed");
    });

    it("returns failed when target has no food-tagged items", () => {
        const { root, thief } = createTestScene();
        const emptyTarget = new Entity("emptyTarget");
        emptyTarget.worldPosition = { x: 13, y: 8 };
        emptyTarget.setEcsComponent(createInventoryComponent());
        root.addChild(emptyTarget);

        const action = { type: "stealFood" as const, targetEntityId: "emptyTarget" };
        const result = executeStealFoodAction(action, thief);

        assert.strictEqual(result.kind, "failed");
    });

    it("returns failed when thief is not adjacent to target", () => {
        const { thief, target } = createTestScene();
        target.worldPosition = { x: 25, y: 25 };

        const action = { type: "stealFood" as const, targetEntityId: "target" };
        const result = executeStealFoodAction(action, thief);

        assert.strictEqual(result.kind, "failed");
    });
});
