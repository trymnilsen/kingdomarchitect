import type { CraftingRecipe } from "../../data/crafting/craftingRecipe.ts";

export type CraftingComponent = {
    id: typeof CraftingComponentId;
    /** Available recipes this building can craft */
    recipes: readonly CraftingRecipe[];
};

export function createCraftingComponent(
    recipes: readonly CraftingRecipe[],
): CraftingComponent {
    return {
        id: CraftingComponentId,
        recipes,
    };
}

export const CraftingComponentId = "Crafting";
