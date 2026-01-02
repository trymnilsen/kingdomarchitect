import type { Entity } from "../entity/entity.ts";

/**
 * Context provided to GOAP actions and goals for accessing the game state.
 * Contains the agent entity ID and the ECS root for querying components.
 */
export type GoapContext = {
    /** The entity ID of the agent performing the action */
    agentId: string;
    /** The root entity for querying components and game state */
    root: Entity;
    /** Current game tick (milliseconds) */
    tick: number;
};

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
     * Check if preconditions are met for this action to be valid.
     * Used during planning to determine which actions are available.
     */
    preconditions: (ctx: GoapContext) => boolean;

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
    execute: (data: TData, ctx: GoapContext) => "in_progress" | "complete";

    /**
     * Optional delay in milliseconds to wait after action completes.
     * Used to create natural pacing in agent behavior.
     */
    postActionDelay?: (data: TData, ctx: GoapContext) => number;
}
