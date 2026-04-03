import type { SpriteRef } from "../../asset/sprite.ts";
import type { CraftingRecipe } from "../crafting/craftingRecipe.ts";
import { carpenterRecipes } from "../crafting/recipes/carpenterRecipes.ts";
import { blacksmithRecipes } from "../crafting/recipes/blacksmithRecipes.ts";
import { bakerRecipes } from "../crafting/recipes/bakerRecipes.ts";
import { tailorRecipes } from "../crafting/recipes/tailorRecipes.ts";
import { NaturalResources } from "./items/naturalResource.ts";
import { quarryProduction } from "../production/productionDefinition.ts";
import { wheatResourceItem } from "./items/resources.ts";

export type ItemSourceRecipe = {
    kind: "recipe";
    recipe: CraftingRecipe;
    buildingName: string;
};

export type ItemSourceResource = {
    kind: "resource";
    resourceName: string;
    resourceAsset: SpriteRef;
    amount: number;
};

export type ItemSourceProduction = {
    kind: "production";
    productionName: string;
    buildingName: string;
    amount: number;
};

export type ItemSource =
    | ItemSourceRecipe
    | ItemSourceResource
    | ItemSourceProduction;

/**
 * Maps each recipe set to its crafting building name.
 * Keep in sync with buildingPrefab.ts when adding new crafting buildings.
 */
const recipeBuildingSets: {
    recipes: readonly CraftingRecipe[];
    buildingName: string;
}[] = [
    { recipes: carpenterRecipes, buildingName: "Carpenter" },
    { recipes: blacksmithRecipes, buildingName: "Blacksmith" },
    { recipes: bakerRecipes, buildingName: "Baker" },
    { recipes: tailorRecipes, buildingName: "Tailor" },
];

/**
 * Returns all known ways to obtain an item: crafting recipes, natural
 * resources, and production buildings.
 */
export function getItemSources(itemId: string): ItemSource[] {
    const sources: ItemSource[] = [];

    // Crafting recipes whose outputs include this item
    for (const { recipes, buildingName } of recipeBuildingSets) {
        for (const recipe of recipes) {
            if (recipe.outputs.some((o) => o.item.id === itemId)) {
                sources.push({ kind: "recipe", recipe, buildingName });
            }
        }
    }

    // Natural resources that yield this item
    for (const resource of NaturalResources) {
        for (const y of resource.yields) {
            if (y.item.id === itemId) {
                sources.push({
                    kind: "resource",
                    resourceName: resource.name,
                    resourceAsset: resource.asset,
                    amount: y.amount,
                });
            }
        }
    }

    // Extract-type production buildings
    if (
        quarryProduction.kind === "extract" &&
        quarryProduction.yield.item.id === itemId
    ) {
        sources.push({
            kind: "production",
            productionName: quarryProduction.actionName,
            buildingName: "Quarry",
            amount: quarryProduction.yield.amount,
        });
    }

    // Farm (hardcoded wheat production)
    if (itemId === wheatResourceItem.id) {
        sources.push({
            kind: "production",
            productionName: "Grow Wheat",
            buildingName: "Farm",
            amount: 4,
        });
    }

    return sources;
}
