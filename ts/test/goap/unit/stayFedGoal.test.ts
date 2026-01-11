import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestAgent, createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";

/**
 * Tests for Stay Fed goal.
 *
 * Uses hysteresis pattern: valid at hunger > 50, satisfied at hunger < 30.
 * The 20-point gap prevents oscillation between eating and not eating.
 */
describe("Stay Fed Goal", () => {
    it("is valid when hunger > 50", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 60, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("stay_fed");

        const ctx = { agent: agent, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), true);
    });

    it("is not valid when hunger <= 50", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 40, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("stay_fed");

        const ctx = { agent: agent, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), false);
    });

    it("is satisfied when hunger < 30", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 25, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("stay_fed");

        const ctx = { agent: agent, root, tick: 0 };
        assert.strictEqual(goal?.isSatisfied(ctx), true);
    });

    it("is not satisfied when hunger >= 30", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("stay_fed");

        const ctx = { agent: agent, root, tick: 0 };
        assert.strictEqual(goal?.isSatisfied(ctx), false);
    });

    it("has higher priority than idle", () => {
        const planner = createUnitPlanner();
        const stayFed = planner.getGoal("stay_fed");
        const idle = planner.getGoal("idle");

        assert.ok(stayFed!.priority > idle!.priority);
    });
});
