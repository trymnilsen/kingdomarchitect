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
    name: "Eat Food",

    getCost: () => 5,

    preconditions: (ctx) => {
        const agent = entityWithId(ctx.root, ctx.agentId);
        if (!agent) {
            return false;
        }

        const inventory = agent.getEcsComponent(InventoryComponentId);
        if (!inventory) {
            return false;
        }

        const hunger = agent.getEcsComponent(HungerComponentId);
        if (!hunger) {
            return false;
        }

        // Must be hungry enough to eat
        if (hunger.hunger < 20) {
            return false;
        }

        // Must have consumable food in inventory
        const hasFood = inventory.items.some(
            (stack) =>
                stack.item.tag?.includes(ItemTag.Consumable) &&
                stack.amount > 0,
        );

        return hasFood;
    },

    createExecutionData: (ctx) => {
        const agent = entityWithId(ctx.root, ctx.agentId);
        if (!agent) {
            throw new Error("Agent not found");
        }

        const inventory = agent.getEcsComponent(InventoryComponentId);
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
        const agent = entityWithId(ctx.root, ctx.agentId);
        if (!agent) {
            throw new Error("Agent not found during execution");
        }

        const inventory = agent.getEcsComponent(InventoryComponentId);
        if (!inventory) {
            throw new Error("No inventory component during execution");
        }

        const hunger = agent.getEcsComponent(HungerComponentId);
        if (!hunger) {
            throw new Error("No hunger component during execution");
        }

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
            agent.invalidateComponent(InventoryComponentId);
            agent.invalidateComponent(HungerComponentId);

            // TODO: Trigger eating animation via animation system
            console.log(
                `Agent ${ctx.agentId} ate ${data.foodName}. Hunger: ${hunger.hunger}`,
            );
        }

        // Action completes immediately after consuming food
        return "complete";
    },

    postActionDelay: () => 2000, // 2 second pause after eating
};
