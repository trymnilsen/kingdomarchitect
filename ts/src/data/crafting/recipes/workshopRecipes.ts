import { spriteRefs } from "../../../asset/sprite.ts";
import {
    clayBricksItem,
    charcoalItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

// TODO: Replace stone input with a raw clay resource once one is added. Stone
// is a temporary placeholder.
export const clayBricksRecipe: CraftingRecipe = {
    id: "craft_claybricks",
    name: "Clay Bricks",
    icon: spriteRefs.stone_resource,
    inputs: [{ item: stoneResource, amount: 4 }],
    outputs: [{ item: clayBricksItem, amount: 2 }],
    duration: 5,
};

export const charcoalRecipe: CraftingRecipe = {
    id: "craft_charcoal",
    name: "Charcoal",
    icon: spriteRefs.wood_resource,
    inputs: [{ item: woodResourceItem, amount: 3 }],
    outputs: [{ item: charcoalItem, amount: 2 }],
    duration: 4,
};

export const workshopRecipes: readonly CraftingRecipe[] = [
    clayBricksRecipe,
    charcoalRecipe,
] as const;
