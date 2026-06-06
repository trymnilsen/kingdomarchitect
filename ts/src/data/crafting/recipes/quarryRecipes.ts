import { spriteRefs } from "../../../asset/sprite.ts";
import {
    stoneResource,
    ironOreItem,
} from "../../inventory/items/resources.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

// The quarry "crafts" in the mechanical sense — the player selects an output and a
// worker yields it — but it is mined rather than assembled, so these recipes take
// no inputs.
export const stoneRecipe: CraftingRecipe = {
    id: "mine_stone",
    name: "Stone",
    icon: spriteRefs.stone_resource,
    inputs: [],
    outputs: [{ item: stoneResource, amount: 5 }],
    duration: 4,
};

export const ironOreRecipe: CraftingRecipe = {
    id: "mine_iron_ore",
    name: "Iron Ore",
    icon: spriteRefs.iron_ore_resource,
    inputs: [],
    outputs: [{ item: ironOreItem, amount: 3 }],
    duration: 5,
};

export const quarryRecipes: readonly CraftingRecipe[] = [
    stoneRecipe,
    ironOreRecipe,
] as const;
