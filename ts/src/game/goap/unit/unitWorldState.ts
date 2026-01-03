import { GoapAgentComponentId } from "../../component/goapAgentComponent.ts";
import { HungerComponentId } from "../../component/hungerComponent.ts";
import { InventoryComponentId } from "../../component/inventoryComponent.ts";
import { entityWithId } from "../../entity/child/withId.ts";
import { ItemTag } from "../../../data/inventory/inventoryItem.ts";
import type { GoapContext } from "../goapContext.ts";
import {
    createWorldState,
    type GoapWorldState,
    setState,
} from "../goapWorldState.ts";

/**
 * Extract the current world state for unit GOAP planning.
 *
 * This function translates the actual game world (ECS components) into
 * a simplified state representation that can be used for A* planning.
 *
 * The state should include:
 * - Everything actions need to check their preconditions
 * - Everything actions modify through their effects
 * - Everything goals check for satisfaction
 *
 * Keep it as minimal as possible - only include state that's actually
 * used in planning. More state = slower planning and larger state space.
 *
 * @param ctx - The planning context
 * @returns A simplified world state for planning
 */
export function getUnitWorldState(ctx: GoapContext): GoapWorldState {
    const state = createWorldState();
    const agent = entityWithId(ctx.root, ctx.agentId);

    if (!agent) {
        // Agent doesn't exist - return empty state
        return state;
    }

    // Extract hunger state
    const hunger = agent.getEcsComponent(HungerComponentId);
    if (hunger) {
        setState(state, "hunger", hunger.hunger);
    }

    // Extract inventory state
    const inventory = agent.getEcsComponent(InventoryComponentId);
    if (inventory) {
        // Check if we have any consumable items (food)
        const hasFood = inventory.items.some(
            (stack) =>
                stack.item.tag?.includes(ItemTag.Consumable) && stack.amount > 0,
        );
        setState(state, "hasFood", hasFood);

        // Could also track specific food types, quantities, etc.
        // For now, just boolean "hasFood" is sufficient
    }

    // Extract last idle time for idle goal satisfaction
    const goapAgent = agent.getEcsComponent(GoapAgentComponentId);
    if (goapAgent && goapAgent.currentPlan?.goalId === "idle") {
        // If currently executing idle action, use the action start time
        setState(state, "lastIdleTime", goapAgent.currentActionStartTick.toString());
    } else {
        // Not currently idling, set to 0 (long time ago)
        setState(state, "lastIdleTime", "0");
    }

    // Extract claimed job ID for job-related actions
    // Only include if we actually have a claimed job
    // This allows wouldBeSatisfiedBy to distinguish between:
    // - Never had a job (key missing) vs. Completed a job (key deleted by effects)
    if (goapAgent?.claimedJob) {
        setState(state, "claimedJob", goapAgent.claimedJob);
    }

    // Future state to add:
    // - Position (for movement-based planning)
    // - Current job
    // - Energy/stamina
    // - Tool availability
    // - etc.

    return state;
}
