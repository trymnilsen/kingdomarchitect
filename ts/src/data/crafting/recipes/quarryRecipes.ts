import { spriteRefs } from "../../../asset/sprite.ts";
import { stoneResource, ironOreItem } from "../../inventory/items/resources.ts";
import { stoneBarsItem } from "../../inventory/items/processedMaterials.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

// The quarry does two kinds of work. Extraction takes no inputs: the player
// selects an output and a worker cuts it out of the ground. Dressing takes raw
// stone and squares it into building blocks.
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

/**
 * Squared masonry blocks. Everything monumental — the church, the gate, the
 * tower — is built out of these, so the quarry is what a kingdom must stand up
 * before it can build in stone rather than merely with it.
 */
export const stoneBarsRecipe: CraftingRecipe = {
    id: "cut_stone_bars",
    name: "Stone Bars",
    icon: spriteRefs.stone_resource,
    inputs: [{ item: stoneResource, amount: 6 }],
    outputs: [{ item: stoneBarsItem, amount: 2 }],
    duration: 6,
};

export const quarryRecipes: readonly CraftingRecipe[] = [
    stoneRecipe,
    ironOreRecipe,
    stoneBarsRecipe,
] as const;
