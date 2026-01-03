import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestAgent, createTestRoot } from "../fixtures.ts";
import { getUnitWorldState } from "../../../src/game/goap/unit/unitWorldState.ts";
import { getState } from "../../../src/game/goap/goapWorldState.ts";
import { GoapAgentComponentId } from "../../../src/game/component/goapAgentComponent.ts";

/**
 * Tests for unit world state extraction.
 *
 * World state is intentionally lossy (e.g., hasFood is boolean, not count)
 * to keep the state space manageable for A* search.
 */
describe("Unit World State Extraction", () => {
    it("extracts hunger from component", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 75, 0);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const state = getUnitWorldState(ctx);

        assert.strictEqual(getState(state, "hunger"), "75");
    });

    it("extracts hasFood=true when inventory has consumables", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 3);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const state = getUnitWorldState(ctx);

        assert.strictEqual(getState(state, "hasFood"), "true");
    });

    it("extracts hasFood=false when inventory is empty", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const ctx = { agentId: agent.id, root, tick: 0 };
        const state = getUnitWorldState(ctx);

        assert.strictEqual(getState(state, "hasFood"), "false");
    });

    it("extracts lastIdleTime when currently idling", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 10, 0);

        // Simulate agent currently executing idle action
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.currentPlan = {
            goalId: "idle",
            steps: [{ actionId: "idle", executionData: {} }],
            totalCost: 1,
        };
        goapAgent.currentActionStartTick = 5000;

        const ctx = { agentId: agent.id, root, tick: 6000 };
        const state = getUnitWorldState(ctx);

        assert.strictEqual(getState(state, "lastIdleTime"), "5000");
    });

    it("sets lastIdleTime to 0 when not idling", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 2);

        const ctx = { agentId: agent.id, root, tick: 1000 };
        const state = getUnitWorldState(ctx);

        assert.strictEqual(getState(state, "lastIdleTime"), "0");
    });

    it("returns empty state when agent doesn't exist", () => {
        const root = createTestRoot();

        const ctx = { agentId: "missing-agent", root, tick: 0 };
        const state = getUnitWorldState(ctx);

        assert.strictEqual(state.size, 0);
    });
});
