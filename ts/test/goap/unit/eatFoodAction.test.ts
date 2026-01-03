import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestAgent, createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { HungerComponentId } from "../../../src/game/component/hungerComponent.ts";
import { InventoryComponentId } from "../../../src/game/component/inventoryComponent.ts";
import { healthPotion } from "../../../src/data/inventory/items/resources.ts";
import { getUnitWorldState } from "../../../src/game/goap/unit/unitWorldState.ts";

describe("Eat Food Action", () => {
    it("requires hunger >= 20", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 15, 5); // Low hunger, has food

        const planner = createUnitPlanner();
        const action = planner.getAction("eat_food");

        const ctx = { agentId: agent.id, root, tick: 0 };
        const state = getUnitWorldState(ctx);
        assert.strictEqual(action?.preconditions(state, ctx), false);
    });

    it("requires food in inventory", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0); // High hunger, no food

        const planner = createUnitPlanner();
        const action = planner.getAction("eat_food");

        const ctx = { agentId: agent.id, root, tick: 0 };
        const state = getUnitWorldState(ctx);
        assert.strictEqual(action?.preconditions(state, ctx), false);
    });

    it("is available when hunger >= 20 and has food", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 2);

        const planner = createUnitPlanner();
        const action = planner.getAction("eat_food");

        const ctx = { agentId: agent.id, root, tick: 0 };
        const state = getUnitWorldState(ctx);
        assert.strictEqual(action?.preconditions(state, ctx), true);
    });

    it("reduces hunger by 40 when executed", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 70, 1);

        const planner = createUnitPlanner();
        const action = planner.getAction("eat_food");
        assert.ok(action, "eat_food action should exist");

        const ctx = { agentId: agent.id, root, tick: 0 };
        const executionData = action.createExecutionData(ctx);
        (action.execute as any)(executionData, ctx);

        const hunger = agent.requireEcsComponent(HungerComponentId);
        assert.strictEqual(hunger.hunger, 30); // 70 - 40
    });

    it("consumes food from inventory", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 70, 3);

        const planner = createUnitPlanner();
        const action = planner.getAction("eat_food");
        assert.ok(action, "eat_food action should exist");

        const ctx = { agentId: agent.id, root, tick: 0 };
        const executionData = action.createExecutionData(ctx);
        (action.execute as any)(executionData, ctx);

        const inventory = agent.requireEcsComponent(InventoryComponentId);
        const foodStack = inventory.items.find(
            (s) => s.item.id === healthPotion.id,
        );
        assert.strictEqual(foodStack?.amount, 2); // 3 - 1
    });
});
