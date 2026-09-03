import type { CraftingRecipe } from "../../data/crafting/craftingRecipe.ts";

/**
 * What the crafter does with the output once it lands in hand. Haul walks it
 * to a stockpile. Drop sets it down beside the bench for a Hauler to collect,
 * so the crafter stays at the building.
 */
export const CraftingOutputPolicy = {
    Haul: "haul",
    Drop: "drop",
} as const;

export type CraftingOutputPolicy =
    (typeof CraftingOutputPolicy)[keyof typeof CraftingOutputPolicy];

export type CraftingComponent = {
    id: typeof CraftingComponentId;
    /** Available recipes this building can craft */
    recipes: readonly CraftingRecipe[];
    outputPolicy: CraftingOutputPolicy;
};

export function createCraftingComponent(
    recipes: readonly CraftingRecipe[],
): CraftingComponent {
    return {
        id: CraftingComponentId,
        recipes,
        outputPolicy: CraftingOutputPolicy.Haul,
    };
}

export const CraftingComponentId = "Crafting";
