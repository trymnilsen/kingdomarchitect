import type { GoapActionDefinition } from "./goapAction.ts";
import type { GoapContext } from "./goapContext.ts";
import type { GoapGoalDefinition } from "./goapGoal.ts";
import { aStarSearch } from "./goapSearch.ts";
import type { GoapWorldState } from "./goapWorldState.ts";

/**
 * Execution data stored with each action in a plan.
 * This is created during planning and used during execution.
 */
export type GoapPlanStep = {
    actionId: string;
    executionData: unknown;
};

/**
 * Result of a planning operation.
 */
export type GoapPlan = {
    /** The goal this plan achieves */
    goalId: string;
    /** Sequence of actions with their execution data */
    steps: GoapPlanStep[];
    /** Total cost of the plan */
    totalCost: number;
};

/**
 * GOAP planner that selects goals and finds action sequences to achieve them.
 * Uses A* search to find optimal action sequences that satisfy goals.
 *
 * @template TAction - Union type of all action definitions this planner handles
 */
/**
 * Dynamic action generator function type.
 * Generators create actions at planning time based on current context.
 */
export type DynamicActionGenerator<T extends GoapActionDefinition<any>> = (
    ctx: GoapContext,
) => T[];

export class GoapPlanner<TAction extends GoapActionDefinition<any> = GoapActionDefinition<any>> {
    private goals: Map<string, GoapGoalDefinition> = new Map();
    private actions: Map<string, TAction> = new Map();
    private dynamicActionGenerators: DynamicActionGenerator<TAction>[] = [];
    private getWorldState: (ctx: GoapContext) => GoapWorldState;
    private lastDynamicActions: Map<string, TAction> = new Map();

    /**
     * Create a GOAP planner with a world state extraction function.
     * @param getWorldState - Function that extracts current world state from context
     */
    constructor(getWorldState: (ctx: GoapContext) => GoapWorldState) {
        this.getWorldState = getWorldState;
    }

    /**
     * Add a goal that agents can pursue.
     * Goals are evaluated in priority order during planning.
     * @param goal - The goal definition to register
     * @returns This planner instance for method chaining
     */
    addGoal(goal: GoapGoalDefinition): this {
        this.goals.set(goal.id, goal);
        return this;
    }

    /**
     * Add an action that agents can perform.
     * Actions are available to all goals during A* search.
     * @param action - The action definition to register
     * @returns This planner instance for method chaining
     */
    addAction(action: TAction): this {
        this.actions.set(action.id, action);
        return this;
    }

    /**
     * Add a dynamic action generator.
     * Generators are called during planning to create context-specific actions.
     * @param generator - Function that generates actions based on current context
     * @returns This planner instance for method chaining
     */
    addDynamicActionGenerator(generator: DynamicActionGenerator<TAction>): this {
        this.dynamicActionGenerators.push(generator);
        return this;
    }

    /**
     * Get an action by ID.
     * Checks both static actions and the last set of dynamically generated actions.
     * @returns The action, or null if not found
     */
    getAction(id: string): TAction | null {
        return this.actions.get(id) ?? this.lastDynamicActions.get(id) ?? null;
    }

    /**
     * Get a goal by ID.
     * @returns The goal, or null if not found
     */
    getGoal(id: string): GoapGoalDefinition | null {
        return this.goals.get(id) ?? null;
    }

    /**
     * Plan actions to achieve the highest priority valid unsatisfied goal.
     * Uses A* search to find the optimal sequence of actions.
     * Returns null if no valid plan can be found.
     */
    plan(ctx: GoapContext): GoapPlan | null {
        // Generate all available actions (static + dynamic)
        const availableActions = this.getAllAvailableActions(ctx);

        // Validate that we have actions registered
        if (availableActions.length === 0) {
            console.warn("GOAP planner has no actions available");
            return null;
        }

        // Get all valid unsatisfied goals sorted by priority
        const goals = this.getAllValidGoals(ctx);

        // Try each goal in priority order
        // A* will find the lowest-cost action sequence for each goal
        for (const goal of goals) {
            // Use A* search to find optimal action sequence
            const plan = aStarSearch(
                ctx,
                goal,
                availableActions,
                this.getWorldState,
                1000, // Max nodes to explore
            );

            if (plan) {
                // Found a valid plan for this goal
                return plan;
            }
        }

        // No valid plan found for any goal
        return null;
    }

    /**
     * Get all available actions by combining static actions with dynamically generated ones.
     */
    private getAllAvailableActions(ctx: GoapContext): TAction[] {
        const actions: TAction[] = Array.from(this.actions.values());

        // Clear previous dynamic actions
        this.lastDynamicActions.clear();

        // Generate dynamic actions
        for (const generator of this.dynamicActionGenerators) {
            const dynamicActions = generator(ctx);
            for (const action of dynamicActions) {
                // Store for later retrieval during execution
                this.lastDynamicActions.set(action.id, action);
            }
            actions.push(...dynamicActions);
        }

        return actions;
    }

    /**
     * Get all valid unsatisfied goals sorted by priority (highest first).
     */
    private getAllValidGoals(ctx: GoapContext): GoapGoalDefinition[] {
        const validGoals: GoapGoalDefinition[] = [];

        for (const goal of this.goals.values()) {
            if (!goal.isValid(ctx)) {
                continue;
            }

            if (goal.isSatisfied(ctx)) {
                continue;
            }

            validGoals.push(goal);
        }

        // Sort by priority (highest first)
        validGoals.sort((a, b) => b.priority - a.priority);

        return validGoals;
    }

}
