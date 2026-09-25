import { spriteRefs } from "../../../asset/sprite.ts";
import {
    wheatResourceItem,
    breadItem,
    fishItem,
    fishPieItem,
} from "../../inventory/items/resources.ts";
import { charcoalItem } from "../../inventory/items/processedMaterials.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

export const breadRecipe: CraftingRecipe = {
    id: "craft_bread",
    name: "Bread",
    icon: spriteRefs.farm_4,
    inputs: [
        { item: wheatResourceItem, amount: 2 },
        { item: charcoalItem, amount: 1 },
    ],
    outputs: [{ item: breadItem, amount: 3 }],
    duration: 5,
};

export const fishPieRecipe: CraftingRecipe = {
    id: "craft_fish_pie",
    name: "Fish Pie",
    icon: spriteRefs.fish_pie,
    inputs: [
        { item: fishItem, amount: 2 },
        { item: wheatResourceItem, amount: 2 },
    ],
    outputs: [{ item: fishPieItem, amount: 2 }],
    duration: 6,
};

export const bakerRecipes: readonly CraftingRecipe[] = [
    breadRecipe,
    fishPieRecipe,
] as const;
