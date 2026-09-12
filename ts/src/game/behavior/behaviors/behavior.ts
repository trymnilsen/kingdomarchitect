import type { Entity } from "../../entity/entity.ts";
import type { BehaviorActionData } from "../actions/actionData.ts";

/**
 * A behavior represents a high-level goal or intention for an entity.
 * It can check if it's valid given the current game state, provide a utility
 * score for prioritization, and expand into a sequence of actions to execute.
 */
export interface Behavior {
    /**
     * Unique name for this behavior (used for tracking current behavior in component)
     */
    name: string;

    /**
     * Check if this behavior is valid for the given entity in the current game state.
     * This should query ECS components directly to determine validity.
     */
    isValid(entity: Entity): boolean;

    /**
     * Return a utility score for this behavior. Higher scores indicate higher priority.
     */
    utility(entity: Entity): number;

    /**
     * Expand this behavior into a sequence of action data to execute.
     * This is called when the behavior is selected for execution.
     */
    expand(entity: Entity): BehaviorActionData[];
}
