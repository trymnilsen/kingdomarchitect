import {
    decreaseHunger,
    HungerComponentId,
} from "../../../component/hungerComponent.ts";
import {
    InventoryComponentId,
    takeInventoryItem,
} from "../../../component/inventoryComponent.ts";
import { entityWithId } from "../../../entity/child/withId.ts";
import { ItemTag } from "../../../../data/inventory/inventoryItem.ts";
import type { GoapActionDefinition } from "../../../goap/goapAction.ts";
import {
    createWorldState,
    getState,
    setState,
} from "../../../goap/goapWorldState.ts";

/**
 * Execution data for the eat food action.
 */
export type EatFoodActionData = {
    /** Amount of hunger to restore */
    amountToRestore: number;
    /** ID of the food item being consumed */
    foodItemId: string;
    /** Name of the food for logging */
    foodName: string;
};

/**
 * Eat food action - consume a food item from inventory to reduce hunger.
 */
export const eatFoodAction: GoapActionDefinition<EatFoodActionData> = {
    id: "eat_food",
    name: "Eating food",

    getCost: () => 5,

    preconditions: (state, _ctx) => {
        // Check preconditions against simulated world state
        // This is used during A* search to determine if action is available

        // Must have food in simulated state
        const hasFood = getState(state, "hasFood") === "true";
        if (!hasFood) {
            return false;
        }

        // Must be hungry enough (using simulated hunger value)
        const hunger = parseInt(getState(state, "hunger") || "0");
        if (hunger < 20) {
            return false;
        }

        return true;
    },

    getEffects: (state) => {
        // Define what changes this action makes to the world state
        // This is used during A* search to simulate future states

        const effects = createWorldState();

        // Eating reduces hunger by a fixed amount
        const currentHunger = parseInt(getState(state, "hunger") || "100");
        const newHunger = Math.max(0, currentHunger - 40);
        setState(effects, "hunger", newHunger);

        // Eating consumes food (simplified - we assume we had food)
        // In reality, we'd need to track specific food items and quantities
        // For now, eating one food item means we might not have food anymore
        // This is a simplification - a full implementation would track inventory better
        setState(effects, "hasFood", "false");

        return effects;
    },

    createExecutionData: (ctx) => {
        const inventory = ctx.agent.getEcsComponent(InventoryComponentId);
        if (!inventory) {
            throw new Error("No inventory component");
        }

        // Find first consumable item
        const foodStack = inventory.items.find((stack) =>
            stack.item.tag?.includes(ItemTag.Consumable),
        );

        if (!foodStack) {
            throw new Error("No food found in inventory");
        }

        return {
            amountToRestore: 40,
            foodItemId: foodStack.item.id,
            foodName: foodStack.item.name,
        };
    },

    execute: (data, ctx) => {
        const inventory = ctx.agent.requireEcsComponent(InventoryComponentId);
        const hunger = ctx.agent.requireEcsComponent(HungerComponentId);

        // Check if we already consumed the food by checking inventory
        const foodStack = inventory.items.find(
            (stack) => stack.item.id === data.foodItemId,
        );

        // If food still exists, this is the first call - consume it
        if (foodStack && foodStack.amount > 0) {
            // Remove food from inventory
            const consumed = takeInventoryItem(inventory, data.foodItemId, 1);
            if (!consumed) {
                throw new Error("Failed to consume food item");
            }

            // Restore hunger
            decreaseHunger(hunger, data.amountToRestore);

            // Invalidate components to trigger replication
            ctx.agent.invalidateComponent(InventoryComponentId);
            ctx.agent.invalidateComponent(HungerComponentId);

            // TODO: Trigger eating animation via animation system
            console.log(
                `Agent ${ctx.agent.id} ate ${data.foodName}. Hunger: ${hunger.hunger}`,
            );
        }

        // Action completes immediately after consuming food
        return "complete";
    },

    postActionDelay: () => 2000, // 2 second pause after eating
};
