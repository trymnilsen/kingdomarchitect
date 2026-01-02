import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../src/game/entity/entity.ts";
import {
    createGoapAgentComponent,
    GoapAgentComponentId,
} from "../../../src/game/component/goapAgentComponent.ts";
import {
    createHungerComponent,
    HungerComponentId,
} from "../../../src/game/component/hungerComponent.ts";
import {
    createInventoryComponent,
    InventoryComponentId,
} from "../../../src/game/component/inventoryComponent.ts";
import { healthPotion } from "../../../src/data/inventory/items/resources.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { createGoapSystem } from "../../../src/game/system/goapSystem.ts";

describe("GOAP MVP", () => {
    it("Agent with low hunger plans idle action", () => {
        // Create root entity
        const root = new Entity("root");
        root.toggleIsGameRoot(true);

        // Create agent with low hunger
        const agent = new Entity("agent1");
        agent.setEcsComponent(createGoapAgentComponent());
        agent.setEcsComponent(createHungerComponent(10, 1)); // Low hunger
        agent.setEcsComponent(createInventoryComponent());

        root.addChild(agent);

        // Create planner and plan
        const planner = createUnitPlanner();
        const ctx = { agentId: agent.id, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan, "Should generate a plan");
        assert.strictEqual(plan.goalId, "idle", "Should plan for idle goal");
        assert.strictEqual(plan.steps.length, 1, "Should have 1 step");
        assert.strictEqual(
            plan.steps[0].actionId,
            "idle",
            "Should plan idle action",
        );
    });

    it("Agent with high hunger and food plans eat action", () => {
        // Create root entity
        const root = new Entity("root");
        root.toggleIsGameRoot(true);

        // Create agent with high hunger and food
        const agent = new Entity("agent1");
        agent.setEcsComponent(createGoapAgentComponent());
        agent.setEcsComponent(createHungerComponent(60, 1)); // High hunger
        agent.setEcsComponent(
            createInventoryComponent([
                { item: healthPotion, amount: 2 }, // Consumable food
            ]),
        );

        root.addChild(agent);

        // Create planner and plan
        const planner = createUnitPlanner();
        const ctx = { agentId: agent.id, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan, "Should generate a plan");
        assert.strictEqual(
            plan.goalId,
            "stay_fed",
            "Should plan for stay_fed goal",
        );
        assert.strictEqual(plan.steps.length, 1, "Should have 1 step");
        assert.strictEqual(
            plan.steps[0].actionId,
            "eat_food",
            "Should plan eat_food action",
        );
    });

    it("Agent with high hunger but no food plans idle action", () => {
        // Create root entity
        const root = new Entity("root");
        root.toggleIsGameRoot(true);

        // Create agent with high hunger but no food
        const agent = new Entity("agent1");
        agent.setEcsComponent(createGoapAgentComponent());
        agent.setEcsComponent(createHungerComponent(60, 1)); // High hunger
        agent.setEcsComponent(createInventoryComponent([])); // No food

        root.addChild(agent);

        // Create planner and plan
        const planner = createUnitPlanner();
        const ctx = { agentId: agent.id, root, tick: 0 };
        const plan = planner.plan(ctx);

        assert.ok(plan, "Should generate a plan");
        assert.strictEqual(
            plan.goalId,
            "idle",
            "Should fall back to idle goal when can't eat",
        );
        assert.strictEqual(plan.steps.length, 1, "Should have 1 step");
        assert.strictEqual(
            plan.steps[0].actionId,
            "idle",
            "Should plan idle action",
        );
    });

    it("GOAP system executes eat action and reduces hunger", () => {
        // Create root entity
        const root = new Entity("root");
        root.toggleIsGameRoot(true);

        // Create agent with high hunger and food
        const agent = new Entity("agent1");
        agent.setEcsComponent(createGoapAgentComponent());
        agent.setEcsComponent(createHungerComponent(60, 1)); // High hunger
        agent.setEcsComponent(
            createInventoryComponent([
                { item: healthPotion, amount: 2 }, // Consumable food
            ]),
        );

        root.addChild(agent);

        // Create and run system
        const planner = createUnitPlanner();
        const goapSystem = createGoapSystem(planner);

        // Initialize and run first update (should plan)
        const initialTick = 0;
        goapSystem.onUpdate!(root, initialTick);

        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        assert.ok(goapAgent.currentPlan, "Should have a plan after first update");
        assert.strictEqual(
            goapAgent.currentPlan.goalId,
            "stay_fed",
            "Should plan for stay_fed goal",
        );

        // Run second update (should execute action synchronously)
        const secondTick = 1000;
        goapSystem.onUpdate!(root, secondTick);

        // Verify hunger decreased (action executed synchronously)
        const hunger = agent.requireEcsComponent(HungerComponentId);
        assert.ok(
            hunger.hunger < 60,
            "Hunger should decrease after eating",
        );
        assert.strictEqual(
            hunger.hunger,
            20,
            "Hunger should be 20 (60 - 40 restore amount)",
        );

        // Verify food consumed
        const inventory = agent.requireEcsComponent(InventoryComponentId);
        const foodStack = inventory.items.find(
            (s) => s.item.id === healthPotion.id,
        );
        assert.ok(foodStack, "Food stack should still exist");
        assert.strictEqual(
            foodStack.amount,
            1,
            "Should have 1 food left (started with 2)",
        );
    });

    it("Agent switches from eating to idle after hunger satisfied", () => {
        // Create root entity
        const root = new Entity("root");
        root.toggleIsGameRoot(true);

        // Create agent with moderate hunger and food
        const agent = new Entity("agent1");
        agent.setEcsComponent(createGoapAgentComponent());
        agent.setEcsComponent(createHungerComponent(55, 1)); // Just above threshold
        agent.setEcsComponent(
            createInventoryComponent([
                { item: healthPotion, amount: 1 }, // Consumable food
            ]),
        );

        root.addChild(agent);

        // Create and run system
        const planner = createUnitPlanner();
        const goapSystem = createGoapSystem(planner);

        // First update: should plan to eat
        let tick = 0;
        goapSystem.onUpdate!(root, tick);

        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(
            goapAgent.currentPlan?.goalId,
            "stay_fed",
            "Should plan to eat when hungry",
        );

        // Second update: execute eating (synchronous)
        tick += 1000;
        goapSystem.onUpdate!(root, tick);

        // Hunger should now be 15 (55 - 40), which is below the "satisfied" threshold of 30
        const hunger = agent.requireEcsComponent(HungerComponentId);
        assert.strictEqual(hunger.hunger, 15, "Hunger should be reduced");

        // Third update: should replan to idle (hunger now satisfied)
        tick += 3000; // Wait for post-action delay + cooldown
        goapSystem.onUpdate!(root, tick);

        assert.strictEqual(
            goapAgent.currentPlan?.goalId,
            "idle",
            "Should switch to idle after hunger satisfied",
        );
    });
});
