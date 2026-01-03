import { GoapPlanner } from "../goapPlanner.ts";
import { eatFoodAction } from "./action/eatFood.ts";
import { idleAction } from "./action/idle.ts";
import { generateClaimOrderActions } from "./action/claimOrder.ts";
import { collectResourceAction } from "./action/collectResource.ts";
import { beProductiveGoal } from "./goal/beProductive.ts";
import { idleGoal } from "./goal/idle.ts";
import { stayFedGoal } from "./goal/stayFed.ts";
import { getUnitWorldState } from "./unitWorldState.ts";

/**
 * Registry of all unit actions.
 * This const object allows TypeScript to infer a union of all action types.
 */
export const unitActions = {
    eat_food: eatFoodAction,
    idle: idleAction,
    collect_resource: collectResourceAction,
} as const;

/**
 * Infer a union type of all unit action definitions.
 * This gives us type safety without using 'any'.
 */
export type UnitAction = (typeof unitActions)[keyof typeof unitActions];

/**
 * Create and configure a GOAP planner for worker units.
 * This planner includes basic survival behaviors (idle, eating) and job execution.
 */
export function createUnitPlanner(): GoapPlanner<UnitAction> {
    // Create planner with world state extraction function
    const planner: GoapPlanner<UnitAction> = new GoapPlanner(getUnitWorldState);

    // Add goals (sorted by priority for readability)
    planner.addGoal(beProductiveGoal); // Priority 20 (highest - work comes first)
    planner.addGoal(stayFedGoal); // Priority 10 (survival need)
    planner.addGoal(idleGoal); // Priority 1 (fallback)

    // Add static actions
    planner.addAction(eatFoodAction);
    planner.addAction(idleAction);
    planner.addAction(collectResourceAction);

    // Add dynamic action generators
    planner.addDynamicActionGenerator(generateClaimOrderActions as any);

    return planner;
}
