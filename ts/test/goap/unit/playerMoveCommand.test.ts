import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestAgent, createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { GoapAgentComponentId } from "../../../src/game/component/goapAgentComponent.ts";
import { getUnitWorldState } from "../../../src/game/goap/unit/unitWorldState.ts";

/**
 * Tests for Player Move Command action.
 *
 * This action executes move commands issued by the player.
 * It uses implicit movement and clears the command when complete.
 */
describe("Player Move Command Action", () => {
    it("requires a move command to be present", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");

        const ctx = { agent, root, tick: 0 };
        const state = getUnitWorldState(ctx);

        // No command = preconditions fail
        assert.strictEqual(action?.preconditions(state, ctx), false);
    });

    it("preconditions pass when move command exists", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        // Set a move command
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 5, y: 10 },
        };

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");

        const ctx = { agent, root, tick: 0 };
        const state = getUnitWorldState(ctx);

        assert.strictEqual(action?.preconditions(state, ctx), true);
    });

    it("preconditions fail for non-move commands", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        // Set an attack command (wrong type)
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "attack",
            targetEntityId: "enemy1",
        };

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");

        const ctx = { agent, root, tick: 0 };
        const state = getUnitWorldState(ctx);

        assert.strictEqual(action?.preconditions(state, ctx), false);
    });

    it("calculates cost based on distance", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);
        agent.worldPosition = { x: 0, y: 0 };

        // Set a move command 5 tiles away
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 3, y: 4 }, // 3-4-5 triangle, distance = 5
        };

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");

        const ctx = { agent, root, tick: 0 };
        const cost = action?.getCost(ctx);

        // Cost = 5 (base) + 5 (distance) = 10
        assert.strictEqual(cost, 10);
    });

    it("has high cost when no move command exists", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");

        const ctx = { agent, root, tick: 0 };
        const cost = action?.getCost(ctx);

        // Should have penalty cost
        assert.strictEqual(cost, 1000);
    });

    it("creates execution data with target position", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const targetPosition = { x: 10, y: 20 };
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition,
        };

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");
        assert.ok(action, "player_move_command action should exist");

        const ctx = { agent, root, tick: 0 };
        const executionData = action.createExecutionData(ctx);

        assert.deepStrictEqual(executionData, { targetPosition });
    });

    it("clears player command when already at destination", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);
        agent.worldPosition = { x: 5, y: 10 };

        // Command to move to current position
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 5, y: 10 },
        };

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");
        assert.ok(action, "player_move_command action should exist");

        const ctx = { agent, root, tick: 0 };
        const executionData = action.createExecutionData(ctx);
        const result = (action.execute as any)(executionData, ctx);

        // Should complete immediately
        assert.strictEqual(result, "complete");

        // Should clear the command
        const updatedAgent = agent.requireEcsComponent(GoapAgentComponentId);
        assert.strictEqual(updatedAgent.playerCommand, undefined);
    });

    it("sets effect to clear player command", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");

        const ctx = { agent, root, tick: 0 };
        const state = getUnitWorldState(ctx);
        const effects = action?.getEffects(state, ctx);

        // Effect should set playerCommand to "cleared"
        assert.strictEqual(effects?.get("playerCommand"), "cleared");
    });

    it("has no post-action delay", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const action = planner.getAction("player_move_command");

        const ctx = { agent, root, tick: 0 };
        const executionData = { targetPosition: { x: 5, y: 10 } };
        const delay = action?.postActionDelay?.(executionData as any, ctx);

        // Should have 0 delay
        assert.strictEqual(delay, 0);
    });
});
