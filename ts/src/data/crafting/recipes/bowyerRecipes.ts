import { spriteRefs } from "../../../asset/sprite.ts";
import { bowItem } from "../../inventory/items/equipment.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

/**
 * Bows are shaped from a single stave, bent and strung. It is woodwork rather
 * than metalwork, which is why it belongs here and not at the forge where it
 * used to sit.
 */
export const bowRecipe: CraftingRecipe = {
    id: "craft_bow",
    name: "Bow",
    icon: spriteRefs.archer_skill,
    inputs: [{ item: woodResourceItem, amount: 15 }],
    outputs: [{ item: bowItem, amount: 1 }],
    duration: 4,
};

export const bowyerRecipes: readonly CraftingRecipe[] = [bowRecipe] as const;
