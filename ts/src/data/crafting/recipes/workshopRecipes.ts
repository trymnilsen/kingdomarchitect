import { spriteRefs } from "../../../asset/sprite.ts";
import {
    clayBricksItem,
    charcoalItem,
    inkItem,
    parchmentItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    berryItem,
    flaxResourceItem,
    stoneResource,
    strawResourceItem,
    woodResourceItem,
} from "../../inventory/items/resources.ts";
import { torchItem, woodenSwordItem } from "../../inventory/items/equipment.ts";
import { bedrollItem } from "../../inventory/items/fieldEquipment.ts";
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

/**
 * Straw stuffed into a flax sack. Both inputs come off a farm, so a settlement
 * can bed its workers down before it has any craft industry at all. This lives
 * at the workshop rather than a tailor because there is no tailor: cloth,
 * looms, and the trade that goes with them are not built yet.
 */
export const bedrollRecipe: CraftingRecipe = {
    id: "craft_bedroll",
    name: "Bedroll",
    icon: spriteRefs.wood_resource,
    inputs: [
        { item: flaxResourceItem, amount: 2 },
        { item: strawResourceItem, amount: 2 },
    ],
    outputs: [{ item: bedrollItem, amount: 1 }],
    duration: 5,
};

/**
 * Flax beaten flat and dried. Writing surface has to exist before anything can
 * be written on it, and it comes off the same farm that feeds the settlement.
 */
export const parchmentRecipe: CraftingRecipe = {
    id: "craft_parchment",
    name: "Parchment",
    icon: spriteRefs.scroll,
    inputs: [{ item: flaxResourceItem, amount: 3 }],
    outputs: [{ item: parchmentItem, amount: 2 }],
    duration: 4,
};

/** Lampblack from the charcoal pile, bound with crushed berries. */
export const inkRecipe: CraftingRecipe = {
    id: "craft_ink",
    name: "Ink",
    icon: spriteRefs.charcoal_resource,
    inputs: [
        { item: charcoalItem, amount: 1 },
        { item: berryItem, amount: 2 },
    ],
    outputs: [{ item: inkItem, amount: 2 }],
    duration: 3,
};

export const workshopRecipes: readonly CraftingRecipe[] = [
    clayBricksRecipe,
    charcoalRecipe,
    torchRecipe,
    woodenSwordRecipe,
    bedrollRecipe,
    parchmentRecipe,
    inkRecipe,
] as const;
