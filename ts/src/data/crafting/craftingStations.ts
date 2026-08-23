import { baker } from "../building/food/baker.ts";
import { enchanter } from "../building/gold/enchanter.ts";
import { blacksmith } from "../building/stone/blacksmith.ts";
import { quary } from "../building/stone/quary.ts";
import { workshop } from "../building/stone/workshop.ts";
import { bowyer } from "../building/wood/bowyer.ts";
import { carpenter } from "../building/wood/carpenter.ts";
import { library } from "../building/gold/library.ts";
import type { Building } from "../building/building.ts";
import type { CraftingRecipe } from "./craftingRecipe.ts";
import { bakerRecipes } from "./recipes/bakerRecipes.ts";
import { blacksmithRecipes } from "./recipes/blacksmithRecipes.ts";
import { bowyerRecipes } from "./recipes/bowyerRecipes.ts";
import { carpenterRecipes } from "./recipes/carpenterRecipes.ts";
import { libraryRecipes } from "./recipes/libraryRecipes.ts";
import { enchanterRecipes } from "./recipes/enchanterRecipes.ts";
import { quarryRecipes } from "./recipes/quarryRecipes.ts";
import { workshopRecipes } from "./recipes/workshopRecipes.ts";

export type CraftingStation = {
    building: Building;
    recipes: readonly CraftingRecipe[];
};

/**
 * Every building that can craft, and what it makes. This is the single answer to
 * "which recipes exist in the world": the prefab reads it to decide what gets a
 * crafting component, and the item-source screen reads it to tell the player
 * where an item comes from.
 *
 * Stations hold the {@link Building} itself rather than an id string, so a
 * recipe set can never be registered against a building that does not exist.
 * A recipe list left in the codebase with no building to make it in is an
 * unreachable item, and unreachable items are how a build order dead-ends.
 */
export const craftingStations: readonly CraftingStation[] = [
    { building: carpenter, recipes: carpenterRecipes },
    { building: blacksmith, recipes: blacksmithRecipes },
    { building: baker, recipes: bakerRecipes },
    { building: workshop, recipes: workshopRecipes },
    { building: quary, recipes: quarryRecipes },
    { building: enchanter, recipes: enchanterRecipes },
    { building: bowyer, recipes: bowyerRecipes },
    { building: library, recipes: libraryRecipes },
] as const;

export function getRecipesForBuilding(
    buildingId: string,
): readonly CraftingRecipe[] | undefined {
    return craftingStations.find(
        (station) => station.building.id === buildingId,
    )?.recipes;
}
