import type { GoapActionDefinition, GoapContext } from "./goapAction.ts";
import type { GoapGoalDefinition } from "./goapGoal.ts";

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
 * Uses simple forward-chaining: pick highest priority unsatisfied goal,
 * then find the lowest cost action that has valid preconditions.
 *
 * @template TAction - Union type of all action definitions this planner handles
 */
export class GoapPlanner<TAction extends GoapActionDefinition<any> = GoapActionDefinition<any>> {
    private goals: Map<string, GoapGoalDefinition> = new Map();
    private actions: Map<string, TAction> = new Map();

    /**
     * Add a goal that agents can pursue.
     */
    addGoal(goal: GoapGoalDefinition): this {
        this.goals.set(goal.id, goal);
        return this;
    }

    /**
     * Add an action that agents can perform.
     */
    addAction(action: TAction): this {
        this.actions.set(action.id, action);
        return this;
    }

    /**
     * Get an action by ID.
     */
    getAction(id: string): TAction | undefined {
        return this.actions.get(id);
    }

    /**
     * Get a goal by ID.
     */
    getGoal(id: string): GoapGoalDefinition | undefined {
        return this.goals.get(id);
    }

    /**
     * Plan actions to achieve the highest priority valid unsatisfied goal.
     * Returns null if no valid plan can be found.
     */
    plan(ctx: GoapContext): GoapPlan | null {
        // Get all valid unsatisfied goals sorted by priority
        const goals = this.getAllValidGoals(ctx);

        // Try each goal in priority order until we find one with a valid action
        for (const goal of goals) {
            const action = this.selectAction(ctx, goal);
            if (action) {
                // Create execution data during planning
                const executionData = action.createExecutionData(ctx);
                const cost = action.getCost(ctx);

                return {
                    goalId: goal.id,
                    steps: [
                        {
                            actionId: action.id,
                            executionData,
                        },
                    ],
                    totalCost: cost,
                };
            }
        }

        // No valid plan found
        return null;
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

    /**
     * Select the lowest cost action with valid preconditions that's relevant to the goal.
     */
    private selectAction(
        ctx: GoapContext,
        goal: GoapGoalDefinition,
    ): TAction | null {
        let bestAction: TAction | null = null;
        let lowestCost = Infinity;

        for (const action of this.actions.values()) {
            // Only consider actions that are relevant to this goal
            if (!goal.relevantActions.includes(action.id)) {
                continue;
            }

            if (!action.preconditions(ctx)) {
                continue;
            }

            const cost = action.getCost(ctx);
            if (cost < lowestCost) {
                lowestCost = cost;
                bestAction = action;
            }
        }

        return bestAction;
    }
}
