import { GoapPlanner } from "../goapPlanner.ts";
import { eatFoodAction } from "./action/eatFood.ts";
import { idleAction } from "./action/idle.ts";
import { idleGoal } from "./goal/idle.ts";
import { stayFedGoal } from "./goal/stayFed.ts";

/**
 * Registry of all unit actions.
 * This const object allows TypeScript to infer a union of all action types.
 */
export const unitActions = {
    eat_food: eatFoodAction,
    idle: idleAction,
} as const;

/**
 * Infer a union type of all unit action definitions.
 * This gives us type safety without using 'any'.
 */
export type UnitAction = (typeof unitActions)[keyof typeof unitActions];

/**
 * Create and configure a GOAP planner for worker units.
 * This planner includes basic survival behaviors (idle, eating).
 */
export function createUnitPlanner(): GoapPlanner<UnitAction> {
    const planner = new GoapPlanner<UnitAction>();

    // Add goals (sorted by priority for readability)
    planner.addGoal(stayFedGoal); // Priority 10
    planner.addGoal(idleGoal); // Priority 1 (fallback)

    // Add actions
    planner.addAction(eatFoodAction);
    planner.addAction(idleAction);

    return planner;
}
