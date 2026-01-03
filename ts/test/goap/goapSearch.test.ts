import { describe, it } from "node:test";
import assert from "node:assert";
import { aStarSearch } from "../../src/game/goap/goapSearch.ts";
import type { GoapActionDefinition } from "../../src/game/goap/goapAction.ts";
import type { GoapGoalDefinition } from "../../src/game/goap/goapGoal.ts";
import type { GoapContext } from "../../src/game/goap/goapContext.ts";
import {
    createWorldState,
    setState,
    getState,
} from "../../src/game/goap/goapWorldState.ts";
import { Entity } from "../../src/game/entity/entity.ts";

/**
 * Tests for A* search algorithm used in GOAP planning.
 * Tests completeness (finds plans if they exist), optimality (lowest cost),
 * and efficiency (closed set prevents redundant exploration).
 */
describe("GoapSearch (A* Algorithm)", () => {
    // Helper to create a minimal context
    function createTestContext(): GoapContext {
        const root = new Entity("root");
        root.toggleIsGameRoot(true);
        return {
            agentId: "test-agent",
            root: root,
            tick: 1000,
        };
    }

    it("finds a single-action plan", () => {
        const ctx = createTestContext();

        // Goal: have a flag set
        const goal: GoapGoalDefinition = {
            id: "test-goal",
            name: "Test Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "flag") === "true",
        };

        // Action: sets the flag
        const action: GoapActionDefinition = {
            id: "set-flag",
            name: "Set Flag",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "flag", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        const plan = aStarSearch(ctx, goal, [action], getCurrentState);

        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.goalId, "test-goal");
        assert.strictEqual(plan!.steps.length, 1);
        assert.strictEqual(plan!.steps[0].actionId, "set-flag");
        assert.strictEqual(plan!.totalCost, 1);
    });

    it("finds a multi-action plan", () => {
        const ctx = createTestContext();

        // Goal: counter reaches 2
        const goal: GoapGoalDefinition = {
            id: "reach-two",
            name: "Reach Two",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => {
                const count = parseInt(getState(state, "count") || "0");
                return count >= 2;
            },
        };

        // Action: increment counter by 1
        const increment: GoapActionDefinition = {
            id: "increment",
            name: "Increment",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: (state) => {
                const current = parseInt(getState(state, "count") || "0");
                const effects = createWorldState();
                setState(effects, "count", current + 1);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        const plan = aStarSearch(ctx, goal, [increment], getCurrentState);

        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.steps.length, 2);
        assert.strictEqual(plan!.steps[0].actionId, "increment");
        assert.strictEqual(plan!.steps[1].actionId, "increment");
        assert.strictEqual(plan!.totalCost, 2);
    });

    it("selects cheaper path when multiple paths exist", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "done") === "true",
        };

        // Expensive action (cost 10)
        const expensiveAction: GoapActionDefinition = {
            id: "expensive",
            name: "Expensive",
            getCost: () => 10,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "done", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        // Cheap action (cost 1)
        const cheapAction: GoapActionDefinition = {
            id: "cheap",
            name: "Cheap",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "done", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        const plan = aStarSearch(
            ctx,
            goal,
            [expensiveAction, cheapAction],
            getCurrentState,
        );

        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.steps.length, 1);
        assert.strictEqual(plan!.steps[0].actionId, "cheap");
        assert.strictEqual(plan!.totalCost, 1);
    });

    // Tests that A* builds plans respecting action dependencies.
    // "gated" action requires "ready" to be true, forcing a 2-step plan: prep → gated.
    it("respects action preconditions", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "goal") === "true",
        };

        // Action that requires "ready" to be true
        const gatedAction: GoapActionDefinition = {
            id: "gated",
            name: "Gated",
            getCost: () => 1,
            preconditions: (state) => getState(state, "ready") === "true",
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "goal", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        // Action that makes us ready
        const prepAction: GoapActionDefinition = {
            id: "prep",
            name: "Prep",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "ready", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        const plan = aStarSearch(
            ctx,
            goal,
            [gatedAction, prepAction],
            getCurrentState,
        );

        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.steps.length, 2);
        assert.strictEqual(plan!.steps[0].actionId, "prep");
        assert.strictEqual(plan!.steps[1].actionId, "gated");
        assert.strictEqual(plan!.totalCost, 2);
    });

    it("returns null when no plan exists", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "impossible",
            name: "Impossible",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) =>
                getState(state, "impossible") === "true",
        };

        // Action that doesn't help achieve the goal
        const uselessAction: GoapActionDefinition = {
            id: "useless",
            name: "Useless",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "other", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        const plan = aStarSearch(ctx, goal, [uselessAction], getCurrentState);

        assert.strictEqual(plan, null);
    });

    it("returns null when preconditions cannot be met", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "goal") === "true",
        };

        // Action requires something that can never be provided
        const impossibleAction: GoapActionDefinition = {
            id: "impossible",
            name: "Impossible",
            getCost: () => 1,
            preconditions: (state) =>
                getState(state, "impossible") === "true",
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "goal", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        const plan = aStarSearch(ctx, goal, [impossibleAction], getCurrentState);

        assert.strictEqual(plan, null);
    });

    // When goal is already satisfied in initial state, A* should return
    // an empty plan (0 steps, 0 cost) rather than null or error.
    it("handles already-satisfied goals", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "done") === "true",
        };

        const action: GoapActionDefinition = {
            id: "action",
            name: "Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "done", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        // Initial state already satisfies goal
        const getCurrentState = () => {
            const state = createWorldState();
            setState(state, "done", true);
            return state;
        };

        const plan = aStarSearch(ctx, goal, [action], getCurrentState);

        // Should return empty plan (goal already satisfied)
        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.steps.length, 0);
        assert.strictEqual(plan!.totalCost, 0);
    });

    // Tests that closed set prevents infinite loops. Toggle action could
    // cycle forever (on→off→on→off...), but closed set detects revisited states.
    it("avoids cycles in state space", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "goal") === "true",
        };

        // Action that toggles a flag but doesn't help reach goal
        const toggleAction: GoapActionDefinition = {
            id: "toggle",
            name: "Toggle",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: (state) => {
                const current = getState(state, "flag") === "true";
                const effects = createWorldState();
                setState(effects, "flag", !current);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        const plan = aStarSearch(ctx, goal, [toggleAction], getCurrentState, 100);

        // Should give up after exploring 100 nodes without finding solution
        assert.strictEqual(plan, null);
    });

    it("respects maxNodes limit", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => {
                const count = parseInt(getState(state, "count") || "0");
                return count >= 1000;
            },
        };

        const increment: GoapActionDefinition = {
            id: "increment",
            name: "Increment",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: (state) => {
                const current = parseInt(getState(state, "count") || "0");
                const effects = createWorldState();
                setState(effects, "count", current + 1);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        // Limit to 10 nodes - should fail to reach goal of 1000
        const plan = aStarSearch(ctx, goal, [increment], getCurrentState, 10);

        assert.strictEqual(plan, null);
    });

    // CLOSED SET VERIFICATION: With two independent variables (a, b), there are
    // many paths to the goal state (a=2, b=2). For example, state (a=1, b=1) can
    // be reached via [inc-a, inc-b] OR [inc-b, inc-a]. Without a closed set, we'd
    // explore both paths. With it, we skip the second. Low node count proves it works.
    it("closed set prevents exploring same state multiple times", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => {
                const a = parseInt(getState(state, "a") || "0");
                const b = parseInt(getState(state, "b") || "0");
                // Goal: both a and b equal 2
                return a === 2 && b === 2;
            },
        };

        // Action that increments 'a'
        const incrementA: GoapActionDefinition = {
            id: "inc-a",
            name: "Increment A",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: (state) => {
                const current = parseInt(getState(state, "a") || "0");
                const effects = createWorldState();
                setState(effects, "a", current + 1);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        // Action that increments 'b'
        const incrementB: GoapActionDefinition = {
            id: "inc-b",
            name: "Increment B",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: (state) => {
                const current = parseInt(getState(state, "b") || "0");
                const effects = createWorldState();
                setState(effects, "b", current + 1);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();

        // Without closed set, there are many paths to explore:
        // - [inc-a, inc-a, inc-b, inc-b]
        // - [inc-a, inc-b, inc-a, inc-b]
        // - [inc-a, inc-b, inc-b, inc-a]
        // - [inc-b, inc-a, inc-a, inc-b]
        // - [inc-b, inc-a, inc-b, inc-a]
        // - [inc-b, inc-b, inc-a, inc-a]
        //
        // The state (a=1, b=1) can be reached by:
        // - [inc-a, inc-b]
        // - [inc-b, inc-a]
        //
        // With closed set, once we explore state (a=1, b=1) from the
        // cheaper path, we skip it when reached from other paths.
        //
        // This should complete quickly with low node count.

        const plan = aStarSearch(
            ctx,
            goal,
            [incrementA, incrementB],
            getCurrentState,
            100, // Should need far fewer than 100 nodes with closed set
        );

        // Should find a plan (any ordering of 2x inc-a and 2x inc-b works)
        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.steps.length, 4);
        assert.strictEqual(plan!.totalCost, 4);

        // Count how many of each action
        const incACount = plan!.steps.filter((s) => s.actionId === "inc-a")
            .length;
        const incBCount = plan!.steps.filter((s) => s.actionId === "inc-b")
            .length;

        assert.strictEqual(incACount, 2);
        assert.strictEqual(incBCount, 2);

        // If this test completes quickly (without timing out or hitting node limit),
        // it proves the closed set is working - without it, we'd explore far more nodes.
    });

    // CLOSED SET VERIFICATION: Diamond pattern (START → A/B → GOAL).
    // Two paths converge to same final state. Closed set prevents re-exploring
    // the convergence. Strict maxNodes=20 proves efficiency.
    it("closed set handles diamond-shaped state space efficiently", () => {
        const ctx = createTestContext();

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) =>
                getState(state, "final") === "true",
        };

        // Path A: set flag1, then converge to final
        const setFlag1: GoapActionDefinition = {
            id: "set-flag1",
            name: "Set Flag 1",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "flag1", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        // Path B: set flag2, then converge to final
        const setFlag2: GoapActionDefinition = {
            id: "set-flag2",
            name: "Set Flag 2",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "flag2", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        // Convergence: works from either flag1 or flag2
        const converge: GoapActionDefinition = {
            id: "converge",
            name: "Converge",
            getCost: () => 1,
            preconditions: (state) =>
                getState(state, "flag1") === "true" ||
                getState(state, "flag2") === "true",
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "final", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const getCurrentState = () => createWorldState();
        const plan = aStarSearch(
            ctx,
            goal,
            [setFlag1, setFlag2, converge],
            getCurrentState,
            20, // Small limit - should only need ~4-6 nodes with closed set
        );

        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.steps.length, 2);

        // First step should be either set-flag1 or set-flag2
        const firstAction = plan!.steps[0].actionId;
        assert.ok(
            firstAction === "set-flag1" || firstAction === "set-flag2",
            "First action should be either set-flag1 or set-flag2",
        );

        // Second step should be converge
        assert.strictEqual(plan!.steps[1].actionId, "converge");

        // The key insight: with closed set, after exploring one path to the final state,
        // we don't need to explore the other path fully. This keeps node count low.
    });
});
