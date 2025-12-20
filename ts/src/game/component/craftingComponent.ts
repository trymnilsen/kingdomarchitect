import type { CraftingRecipe } from "../../data/crafting/craftingRecipe.js";

export type CraftingComponent = {
    id: typeof CraftingComponentId;
    /** Available recipes this building can craft */
    recipes: readonly CraftingRecipe[];
    /** Currently active crafting job */
    activeCrafting: ActiveCrafting | null;
};

export type ActiveCrafting = {
    recipe: CraftingRecipe;
    /** Tick when crafting started */
    startTick: number;
};

export function createCraftingComponent(
    recipes: readonly CraftingRecipe[],
): CraftingComponent {
    return {
        id: CraftingComponentId,
        recipes,
        activeCrafting: null,
    };
}

export const CraftingComponentId = "Crafting";

/**
 * Check if crafting is currently in progress
 */
export function isCrafting(component: CraftingComponent): boolean {
    return component.activeCrafting !== null;
}

/**
 * Check if the building is available for new crafting
 * (not currently crafting)
 */
export function isAvailableForCrafting(component: CraftingComponent): boolean {
    return !isCrafting(component);
}

/**
 * Start a new crafting job
 */
export function startCrafting(
    component: CraftingComponent,
    recipe: CraftingRecipe,
    currentTick: number,
): void {
    if (component.activeCrafting) {
        console.warn("Cannot start crafting: already crafting");
        return;
    }

    component.activeCrafting = {
        recipe,
        startTick: currentTick,
    };
}

/**
 * Cancel active crafting
 */
export function cancelCrafting(component: CraftingComponent): void {
    component.activeCrafting = null;
}

/**
 * Complete crafting and clear the active job
 * The crafting system will add the result to CollectableComponent
 */
export function completeCrafting(component: CraftingComponent): void {
    component.activeCrafting = null;
}
