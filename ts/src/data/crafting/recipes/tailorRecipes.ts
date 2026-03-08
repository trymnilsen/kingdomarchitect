import { spriteRefs } from "../../../asset/sprite.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";
import { bedrollItem } from "../../inventory/items/fieldEquipment.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

// TODO: Replace wood input with cloth/fiber/leather items when the tailor
// supply chain is implemented. Wood is a temporary placeholder.
export const bedrollRecipe: CraftingRecipe = {
    id: "craft_bedroll",
    name: "Bedroll",
    icon: spriteRefs.wood_resource,
    inputs: [{ item: woodResourceItem, amount: 3 }],
    outputs: [{ item: bedrollItem, amount: 1 }],
    duration: 5,
};

export const tailorRecipes: readonly CraftingRecipe[] = [
    bedrollRecipe,
] as const;
