import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestAgent, createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { getUnitWorldState } from "../../../src/game/goap/unit/unitWorldState.ts";

/**
 * Tests for Idle action.
 *
 * Idle is a fallback action that completes immediately. It's designed to work with
 * the time-based Idle goal which triggers replanning after 5 seconds.
 */
describe("Idle Action", () => {
    it("is always available", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const action = planner.getAction("idle");

        const ctx = { agent: agent, root, tick: 0 };
        const state = getUnitWorldState(ctx);
        assert.strictEqual(action?.preconditions(state, ctx), true);
    });

    it("completes after duration", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 10, 0);

        const planner = createUnitPlanner();
        const action = planner.getAction("idle");
        assert.ok(action, "idle action should exist");

        const ctx = { agent: agent, root, tick: 0 };
        const executionData = action.createExecutionData(ctx);

        // First execution at tick 0 - should be in progress
        let result = (action.execute as any)(executionData, ctx);
        assert.strictEqual(result, "in_progress");

        // Execute at tick 5 - still in progress (duration is 10 ticks)
        result = (action.execute as any)(executionData, { ...ctx, tick: 5 });
        assert.strictEqual(result, "in_progress");

        // Execute at tick 10 - should complete
        result = (action.execute as any)(executionData, { ...ctx, tick: 10 });
        assert.strictEqual(result, "complete");
    });
});
