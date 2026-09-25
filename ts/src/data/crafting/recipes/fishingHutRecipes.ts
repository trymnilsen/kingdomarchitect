import { spriteRefs } from "../../../asset/sprite.ts";
import { fishItem } from "../../inventory/items/resources.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

export const catchFishRecipe: CraftingRecipe = {
    id: "catch_fish",
    name: "Fish",
    icon: spriteRefs.fish,
    inputs: [],
    outputs: [{ item: fishItem, amount: 3 }],
    duration: 4,
};

export const fishingHutRecipes: readonly CraftingRecipe[] = [
    catchFishRecipe,
] as const;
