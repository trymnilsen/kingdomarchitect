import { describe, it } from "node:test";
import assert from "node:assert";

import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";

/**
 * Tests for Idle behavior.
 *
 * Note: There is no explicit idle action in the current design.
 * Agents without valid plans will remain idle (no action to execute).
 * These tests verify that the planner doesn't have an idle action registered.
 */
describe("Idle Action", () => {
    it("does not have an explicit idle action", () => {
        const planner = createUnitPlanner();
        const action = planner.getAction("idle");

        // Design decision: no explicit idle action needed
        // Agents with no valid plan simply don't execute any action
        assert.strictEqual(action, null);
    });
});
