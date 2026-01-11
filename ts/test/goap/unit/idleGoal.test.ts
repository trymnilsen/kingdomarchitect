import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestAgent, createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { GoapAgentComponentId } from "../../../src/game/component/goapAgentComponent.ts";

/**
 * Tests for Idle goal.
 *
 * Idle is time-based: satisfied for 5 seconds, then becomes unsatisfied to trigger replan.
 * This allows idle to work with A* search without special-casing infinite actions.
 */
describe("Idle Goal", () => {
    it("is always valid", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("idle");

        const ctx = { agent: agent, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), true);
    });

    it("is satisfied when currently idling for < 5 seconds", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 10, 0);

        // Set up agent as currently idling
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.currentPlan = {
            goalId: "idle",
            steps: [{ actionId: "idle", executionData: {} }],
            totalCost: 1,
        };
        goapAgent.currentStepIndex = 0;
        goapAgent.currentActionStartTick = 1000;

        const planner = createUnitPlanner();
        const goal = planner.getGoal("idle");

        // Check at tick 3000 (2 seconds after start)
        const ctx = { agent: agent, root, tick: 3000 };
        assert.strictEqual(goal?.isSatisfied(ctx), true);
    });

    it("is not satisfied when idling for >= 5 seconds", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 10, 0);

        // Set up agent as currently idling
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.currentPlan = {
            goalId: "idle",
            steps: [{ actionId: "idle", executionData: {} }],
            totalCost: 1,
        };
        goapAgent.currentStepIndex = 0;
        goapAgent.currentActionStartTick = 1000;

        const planner = createUnitPlanner();
        const goal = planner.getGoal("idle");

        // Check at tick 7000 (6 seconds after start)
        const ctx = { agent: agent, root, tick: 7000 };
        assert.strictEqual(goal?.isSatisfied(ctx), false);
    });

    it("is not satisfied when not currently idling", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 10, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("idle");

        const ctx = { agent: agent, root, tick: 0 };
        assert.strictEqual(goal?.isSatisfied(ctx), false);
    });
});
