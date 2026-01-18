import { describe, it } from "node:test";
import assert from "node:assert";

import { createTestAgent, createTestRoot } from "../fixtures.ts";
import { createUnitPlanner } from "../../../src/game/goap/unit/unitPlanner.ts";
import { GoapAgentComponentId } from "../../../src/game/component/goapAgentComponent.ts";
import { getUnitWorldState } from "../../../src/game/goap/unit/unitWorldState.ts";
import { createWorldState, setState } from "../../../src/game/goap/goapWorldState.ts";

/**
 * Tests for Follow Player Command goal.
 *
 * This goal has highest priority (50) and becomes valid when a player command
 * is set on the GOAP agent component. It's satisfied when the command is cleared.
 */
describe("Follow Player Command Goal", () => {
    it("is valid when player command exists", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        // Set a player command
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 5, y: 10 },
        };

        const planner = createUnitPlanner();
        const goal = planner.getGoal("follow_player_command");

        const ctx = { agent, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), true);
    });

    it("is not valid when no player command exists", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("follow_player_command");

        const ctx = { agent, root, tick: 0 };
        assert.strictEqual(goal?.isValid(ctx), false);
    });

    it("is satisfied when player command is cleared", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        // No player command = satisfied
        const planner = createUnitPlanner();
        const goal = planner.getGoal("follow_player_command");

        const ctx = { agent, root, tick: 0 };
        assert.strictEqual(goal?.isSatisfied(ctx), true);
    });

    it("is not satisfied when player command exists", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        // Set a player command
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "attack",
            targetEntityId: "enemy1",
        };

        const planner = createUnitPlanner();
        const goal = planner.getGoal("follow_player_command");

        const ctx = { agent, root, tick: 0 };
        assert.strictEqual(goal?.isSatisfied(ctx), false);
    });

    it("would be satisfied by 'cleared' state", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("follow_player_command");

        // Simulate state after action clears command
        const state = createWorldState();
        setState(state, "playerCommand", "cleared");

        const ctx = { agent, root, tick: 0 };
        assert.strictEqual(goal?.wouldBeSatisfiedBy(state, ctx), true);
    });

    it("would not be satisfied by 'pending' state", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const planner = createUnitPlanner();
        const goal = planner.getGoal("follow_player_command");

        // Simulate state with pending command
        const state = createWorldState();
        setState(state, "playerCommand", "pending");

        const ctx = { agent, root, tick: 0 };
        assert.strictEqual(goal?.wouldBeSatisfiedBy(state, ctx), false);
    });

    it("has highest priority (50)", () => {
        const planner = createUnitPlanner();
        const followPlayerCommand = planner.getGoal("follow_player_command");
        const sleepGoal = planner.getGoal("sleep");
        const beProductiveGoal = planner.getGoal("be_productive");
        const stayFedGoal = planner.getGoal("stay_fed");

        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);
        const ctx = { agent, root, tick: 0 };

        assert.strictEqual(followPlayerCommand?.priority(ctx), 50);
        assert.ok(
            followPlayerCommand!.priority(ctx) > sleepGoal!.priority(ctx),
            "Player commands should override sleep",
        );
        assert.ok(
            followPlayerCommand!.priority(ctx) >
                beProductiveGoal!.priority(ctx),
            "Player commands should override work",
        );
        assert.ok(
            followPlayerCommand!.priority(ctx) > stayFedGoal!.priority(ctx),
            "Player commands should override hunger",
        );
    });

    it("extracts player command state correctly", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        // Set a player command
        const goapAgent = agent.requireEcsComponent(GoapAgentComponentId);
        goapAgent.playerCommand = {
            action: "move",
            targetPosition: { x: 5, y: 10 },
        };

        const ctx = { agent, root, tick: 0 };
        const state = getUnitWorldState(ctx);

        // Should have "pending" in world state
        assert.ok(state.has("playerCommand"));
        assert.strictEqual(state.get("playerCommand"), "pending");
    });

    it("does not extract state when no command exists", () => {
        const root = createTestRoot();
        const agent = createTestAgent(root, 50, 0);

        const ctx = { agent, root, tick: 0 };
        const state = getUnitWorldState(ctx);

        // Should not have playerCommand key in state
        assert.strictEqual(state.has("playerCommand"), false);
    });
});
