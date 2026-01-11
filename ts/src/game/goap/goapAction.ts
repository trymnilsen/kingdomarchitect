import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import type { GoapContext } from "./goapContext.ts";
import type { GoapWorldState } from "./goapWorldState.ts";

export type GoapActionExecutionResult = "in_progress" | "complete";

/**
 * Defines a GOAP action that can be planned and executed by an agent.
 * Actions have costs, preconditions for planning, and execution logic.
 *
 * @template TData - The type of execution data created during planning
 */
export interface GoapActionDefinition<TData = unknown> {
    /** Unique identifier for this action */
    id: string;

    /** Human-readable name for debugging */
    name: string;

    /**
     * Calculate the cost of executing this action.
     * Lower costs are preferred during planning.
     * Can include movement costs, resource costs, etc.
     */
    getCost: (ctx: GoapContext) => number;

    /**
     * Check if preconditions are met in a simulated world state.
     * Used during A* search to determine which actions are available
     * in hypothetical future states.
     *
     * @param state - The simulated world state to check against
     * @param ctx - The planning context
     */
    preconditions: (state: GoapWorldState, ctx: GoapContext) => boolean;

    /**
     * Get the effects this action would have on the world state.
     * Effects represent the changes this action makes to the world.
     * Used during A* search to simulate future states.
     *
     * @param state - The current world state
     * @param ctx - The planning context
     * @returns A map of state changes this action would make
     */
    getEffects: (state: GoapWorldState, ctx: GoapContext) => GoapWorldState;

    /**
     * Create execution data during planning.
     * This captures the state needed to execute the action later.
     * Keeps planning and execution separate.
     */
    createExecutionData: (ctx: GoapContext) => TData;

    /**
     * Execute the action with the previously created execution data.
     * This is where the actual game state changes happen.
     * Must be synchronous and idempotent - will be called every update until complete.
     *
     * @returns "in_progress" if action is still executing, "complete" when done
     */
    execute: (data: TData, ctx: GoapContext) => GoapActionExecutionResult;

    /**
     * Optional delay in milliseconds to wait after action completes.
     * Used to create natural pacing in agent behavior.
     */
    postActionDelay?: (data: TData, ctx: GoapContext) => number;
}
