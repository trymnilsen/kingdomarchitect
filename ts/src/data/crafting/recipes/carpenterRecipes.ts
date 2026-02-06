import { spriteRefs } from "../../../asset/sprite.ts";
import {
    planksItem,
    timberFramesItem,
    joineryItem,
} from "../../inventory/items/processedMaterials.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

export const planksRecipe: CraftingRecipe = {
    id: "craft_planks",
    name: "Planks",
    icon: spriteRefs.wood_resource,
    inputs: [{ item: woodResourceItem, amount: 4 }],
    outputs: [{ item: planksItem, amount: 2 }],
    duration: 3,
};

export const timberFramesRecipe: CraftingRecipe = {
    id: "craft_timber_frames",
    name: "Timber Frames",
    icon: spriteRefs.wood_resource,
    inputs: [{ item: planksItem, amount: 4 }],
    outputs: [{ item: timberFramesItem, amount: 1 }],
    duration: 5,
};

export const joineryRecipe: CraftingRecipe = {
    id: "craft_joinery",
    name: "Joinery",
    icon: spriteRefs.wood_resource,
    inputs: [{ item: planksItem, amount: 2 }],
    outputs: [{ item: joineryItem, amount: 1 }],
    duration: 4,
};

export const carpenterRecipes: readonly CraftingRecipe[] = [
    planksRecipe,
    timberFramesRecipe,
    joineryRecipe,
] as const;
