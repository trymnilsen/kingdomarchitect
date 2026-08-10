import { spriteRefs } from "../../../asset/sprite.ts";
import {
    clayBricksItem,
    charcoalItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    stoneResource,
    strawResourceItem,
    woodResourceItem,
} from "../../inventory/items/resources.ts";
import { torchItem, woodenSwordItem } from "../../inventory/items/equipment.ts";
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

/**
 * Straw and a stick. Both inputs are gathered rather than processed, so this is
 * craftable the moment the workshop stands.
 */
export const torchRecipe: CraftingRecipe = {
    id: "craft_torch",
    name: "Torch",
    icon: spriteRefs.torches,
    inputs: [
        { item: woodResourceItem, amount: 2 },
        { item: strawResourceItem, amount: 1 },
    ],
    outputs: [{ item: torchItem, amount: 1 }],
    duration: 2,
};

/**
 * A weapon from wood alone. Cheaper and quicker than the blacksmith's sword,
 * and worse, which is what makes it the one you arm people with first.
 */
export const woodenSwordRecipe: CraftingRecipe = {
    id: "craft_woodensword",
    name: "Wooden Sword",
    icon: spriteRefs.sword_skill,
    inputs: [{ item: woodResourceItem, amount: 4 }],
    outputs: [{ item: woodenSwordItem, amount: 1 }],
    duration: 3,
};

export const workshopRecipes: readonly CraftingRecipe[] = [
    clayBricksRecipe,
    charcoalRecipe,
    torchRecipe,
    woodenSwordRecipe,
] as const;
