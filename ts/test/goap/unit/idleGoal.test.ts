import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestAgent, createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";

/**
 * Tests for Idle behavior.
 *
 * Note: There is no explicit idle goal/action in the current design.
 * Agents without valid plans will remain idle (no plan, no action).
 * These tests verify that the planner doesn't have an idle goal registered.
 */
describe("Idle Goal", () => {
    it("does not have an explicit idle goal", () => {
        const planner = createUnitPlanner();
        const goal = planner.getGoal("idle");

        // Design decision: no explicit idle goal needed
        // Agents with no valid plan are idle by default
        assert.strictEqual(goal, null);
    });

    it("agents without valid plans have no plan", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const ctx = { agent: agent, root, tick: 0 };
        const plan = planner.plan(ctx);

        // With no jobs available and no urgent needs, there should be no plan
        // (agent will be idle)
        assert.strictEqual(plan, null);
    });
});
