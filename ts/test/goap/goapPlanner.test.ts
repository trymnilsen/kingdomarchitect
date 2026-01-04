import { describe, it } from "node:test";
import assert from "node:assert";
import { GoapPlanner } from "../../src/game/goap/goapPlanner.ts";
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
 * Tests for GoapPlanner - orchestrates goal selection and delegates to A* search.
 * Tests goal filtering (validity, satisfaction), priority ordering, and fallback behavior.
 */
describe("GoapPlanner", () => {
    function createTestContext(): GoapContext {
        const root = new Entity("root");
        root.toggleIsGameRoot(true);
        return {
            agentId: "test-agent",
            root: root,
            tick: 1000,
        };
    }

    it("creates planner with world state function", () => {
        const planner = new GoapPlanner(() => createWorldState());
        assert.ok(planner);
    });

    it("adds and retrieves goals", () => {
        const planner = new GoapPlanner(() => createWorldState());

        const goal: GoapGoalDefinition = {
            id: "test-goal",
            name: "Test Goal",
            priority: () => 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: () => false,
        };

        planner.addGoal(goal);
        const retrieved = planner.getGoal("test-goal");

        assert.strictEqual(retrieved, goal);
    });

    it("adds and retrieves actions", () => {
        const planner = new GoapPlanner(() => createWorldState());

        const action: GoapActionDefinition = {
            id: "test-action",
            name: "Test Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => createWorldState(),
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        planner.addAction(action);
        const retrieved = planner.getAction("test-action");

        assert.strictEqual(retrieved, action);
    });

    it("returns null for missing goal", () => {
        const planner = new GoapPlanner(() => createWorldState());
        assert.strictEqual(planner.getGoal("missing"), null);
    });

    it("returns null for missing action", () => {
        const planner = new GoapPlanner(() => createWorldState());
        assert.strictEqual(planner.getAction("missing"), null);
    });

    // Planner should choose high-priority goal even when both are achievable.
    it("selects highest priority valid unsatisfied goal", () => {
        const ctx = createTestContext();
        const planner = new GoapPlanner(() => createWorldState());

        const lowPriorityGoal: GoapGoalDefinition = {
            id: "low",
            name: "Low Priority",
            priority: () => 1,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "low") === "true",
        };

        const highPriorityGoal: GoapGoalDefinition = {
            id: "high",
            name: "High Priority",
            priority: () => 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "high") === "true",
        };

        const lowAction: GoapActionDefinition = {
            id: "low-action",
            name: "Low Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "low", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        const highAction: GoapActionDefinition = {
            id: "high-action",
            name: "High Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "high", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        planner.addGoal(lowPriorityGoal);
        planner.addGoal(highPriorityGoal);
        planner.addAction(lowAction);
        planner.addAction(highAction);

        const plan = planner.plan(ctx);

        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.goalId, "high");
        assert.strictEqual(plan!.steps[0].actionId, "high-action");
    });

    // Invalid goal (isValid=false) should be skipped even if higher priority.
    it("skips invalid goals", () => {
        const ctx = createTestContext();
        const planner = new GoapPlanner(() => createWorldState());

        const invalidGoal: GoapGoalDefinition = {
            id: "invalid",
            name: "Invalid Goal",
            priority: () => 100,
            isValid: () => false, // Not valid
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) =>
                getState(state, "invalid") === "true",
        };

        const validGoal: GoapGoalDefinition = {
            id: "valid",
            name: "Valid Goal",
            priority: () => 1,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "valid") === "true",
        };

        const validAction: GoapActionDefinition = {
            id: "valid-action",
            name: "Valid Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "valid", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        planner.addGoal(invalidGoal);
        planner.addGoal(validGoal);
        planner.addAction(validAction);

        const plan = planner.plan(ctx);

        // Should select valid goal despite lower priority
        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.goalId, "valid");
    });

    // Satisfied goal (isSatisfied=true) should be skipped even if higher priority.
    it("skips already satisfied goals", () => {
        const ctx = createTestContext();
        const planner = new GoapPlanner(() => createWorldState());

        const satisfiedGoal: GoapGoalDefinition = {
            id: "satisfied",
            name: "Satisfied Goal",
            priority: () => 100,
            isValid: () => true,
            isSatisfied: () => true, // Already satisfied
            wouldBeSatisfiedBy: (state) =>
                getState(state, "satisfied") === "true",
        };

        const unsatisfiedGoal: GoapGoalDefinition = {
            id: "unsatisfied",
            name: "Unsatisfied Goal",
            priority: () => 1,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) =>
                getState(state, "unsatisfied") === "true",
        };

        const action: GoapActionDefinition = {
            id: "action",
            name: "Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "unsatisfied", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        planner.addGoal(satisfiedGoal);
        planner.addGoal(unsatisfiedGoal);
        planner.addAction(action);

        const plan = planner.plan(ctx);

        // Should select unsatisfied goal
        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.goalId, "unsatisfied");
    });

    it("returns null when no valid goals exist", () => {
        const ctx = createTestContext();
        const planner = new GoapPlanner(() => createWorldState());

        const invalidGoal: GoapGoalDefinition = {
            id: "invalid",
            name: "Invalid",
            priority: () => 10,
            isValid: () => false,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: () => false,
        };

        planner.addGoal(invalidGoal);

        const plan = planner.plan(ctx);
        assert.strictEqual(plan, null);
    });

    it("returns null when all goals are satisfied", () => {
        const ctx = createTestContext();
        const planner = new GoapPlanner(() => createWorldState());

        const satisfiedGoal: GoapGoalDefinition = {
            id: "satisfied",
            name: "Satisfied",
            priority: () => 10,
            isValid: () => true,
            isSatisfied: () => true,
            wouldBeSatisfiedBy: () => true,
        };

        planner.addGoal(satisfiedGoal);

        const plan = planner.plan(ctx);
        assert.strictEqual(plan, null);
    });

    it("returns null when no plan can achieve goal", () => {
        const ctx = createTestContext();
        const planner = new GoapPlanner(() => createWorldState());

        const goal: GoapGoalDefinition = {
            id: "impossible",
            name: "Impossible",
            priority: () => 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) =>
                getState(state, "impossible") === "true",
        };

        // Action doesn't help achieve goal
        const action: GoapActionDefinition = {
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

        planner.addGoal(goal);
        planner.addAction(action);

        const plan = planner.plan(ctx);
        assert.strictEqual(plan, null);
    });

    it("uses world state extraction function", () => {
        const ctx = createTestContext();

        let extractionCalled = false;
        const getWorldState = () => {
            extractionCalled = true;
            const state = createWorldState();
            setState(state, "custom", true);
            return state;
        };

        const planner = new GoapPlanner(getWorldState);

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: () => 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) => getState(state, "custom") === "true",
        };

        // Add a dummy action so planning proceeds
        const action: GoapActionDefinition = {
            id: "action",
            name: "Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => createWorldState(),
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        planner.addGoal(goal);
        planner.addAction(action);
        planner.plan(ctx);

        assert.strictEqual(extractionCalled, true);
    });

    it("allows chaining addGoal and addAction", () => {
        const planner = new GoapPlanner(() => createWorldState());

        const goal: GoapGoalDefinition = {
            id: "goal",
            name: "Goal",
            priority: () => 10,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: () => false,
        };

        const action: GoapActionDefinition = {
            id: "action",
            name: "Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => createWorldState(),
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        // Should allow chaining
        const result = planner.addGoal(goal).addAction(action);
        assert.strictEqual(result, planner);
    });

    // Hysteresis pattern: Goals use different thresholds for becoming valid
    // vs. becoming satisfied to prevent oscillation (e.g., valid at hunger > 50,
    // satisfied at hunger < 30). This creates a "gap" that prevents rapid switching.
    it("supports hysteresis pattern to prevent goal oscillation", () => {
        const ctx = createTestContext();
        const planner = new GoapPlanner(() => {
            const state = createWorldState();
            // Simulate a value that changes over time (e.g., hunger, energy, health)
            setState(state, "value", "45");
            return state;
        });

        // Goal uses hysteresis:
        // - Becomes VALID when value > 50
        // - Becomes SATISFIED when value < 30
        // This 20-point gap prevents oscillation in the 30-50 range
        const hysteresisGoal: GoapGoalDefinition = {
            id: "hysteresis",
            name: "Hysteresis Goal",
            priority: () => 10,
            isValid: (ctx) => {
                // Goal becomes valid when value crosses upper threshold
                const state = planner["getWorldState"](ctx);
                const value = parseInt(getState(state, "value") || "0");
                return value > 50;
            },
            isSatisfied: (ctx) => {
                // Goal becomes satisfied when value crosses lower threshold
                const state = planner["getWorldState"](ctx);
                const value = parseInt(getState(state, "value") || "0");
                return value < 30;
            },
            wouldBeSatisfiedBy: (state) => {
                const value = parseInt(getState(state, "value") || "0");
                return value < 30;
            },
        };

        const action: GoapActionDefinition = {
            id: "reduce-value",
            name: "Reduce Value",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "value", "25"); // Reduces below satisfaction threshold
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        planner.addGoal(hysteresisGoal);
        planner.addAction(action);

        // At value=45 (in the gap):
        // - Goal is NOT valid (45 <= 50)
        // - Goal is NOT satisfied (45 >= 30)
        // This prevents replanning when value is in the hysteresis gap
        assert.strictEqual(hysteresisGoal.isValid(ctx), false);
        assert.strictEqual(hysteresisGoal.isSatisfied(ctx), false);
    });

    // When high-priority goal is impossible (no valid plan), planner should
    // fall back to next goal in priority order.
    it("tries goals in priority order until plan found", () => {
        const ctx = createTestContext();
        const planner = new GoapPlanner(() => createWorldState());

        // High priority but impossible
        const impossibleGoal: GoapGoalDefinition = {
            id: "impossible",
            name: "Impossible",
            priority: () => 100,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) =>
                getState(state, "impossible") === "true",
        };

        // Low priority but achievable
        const achievableGoal: GoapGoalDefinition = {
            id: "achievable",
            name: "Achievable",
            priority: () => 1,
            isValid: () => true,
            isSatisfied: () => false,
            wouldBeSatisfiedBy: (state) =>
                getState(state, "achievable") === "true",
        };

        const action: GoapActionDefinition = {
            id: "action",
            name: "Action",
            getCost: () => 1,
            preconditions: () => true,
            getEffects: () => {
                const effects = createWorldState();
                setState(effects, "achievable", true);
                return effects;
            },
            createExecutionData: () => ({}),
            execute: () => "complete",
            postActionDelay: () => 0,
        };

        planner.addGoal(impossibleGoal);
        planner.addGoal(achievableGoal);
        planner.addAction(action);

        const plan = planner.plan(ctx);

        // Should fall back to achievable goal
        assert.notStrictEqual(plan, null);
        assert.strictEqual(plan!.goalId, "achievable");
    });
});
