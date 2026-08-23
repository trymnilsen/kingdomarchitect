import { spriteRefs } from "../../../asset/sprite.ts";
import {
    inkItem,
    parchmentItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    blueBook,
    gemResource,
    scroll,
} from "../../inventory/items/resources.ts";
import type { CraftingRecipe } from "../craftingRecipe.ts";

/**
 * A single working, copied out fair. Scribing is the cheap end of the library's
 * work: parchment and ink and a steady hand, nothing that has to be fought for.
 */
export const scrollRecipe: CraftingRecipe = {
    id: "scribe_scroll",
    name: "Magic Scroll",
    icon: spriteRefs.scroll,
    inputs: [
        { item: parchmentItem, amount: 2 },
        { item: inkItem, amount: 1 },
    ],
    outputs: [{ item: scroll, amount: 1 }],
    duration: 5,
};

/**
 * A bound volume with a gem set into the cover as its focus. The gem is the
 * expensive part and it only comes off a dead goblin, which is what keeps a
 * library standing on the back of somebody having gone out and fought for it.
 */
export const tomeRecipe: CraftingRecipe = {
    id: "scribe_tome",
    name: "Tome of Secrets",
    icon: spriteRefs.blue_book,
    inputs: [
        { item: parchmentItem, amount: 8 },
        { item: inkItem, amount: 3 },
        { item: gemResource, amount: 1 },
    ],
    outputs: [{ item: blueBook, amount: 1 }],
    duration: 10,
};

export const libraryRecipes: readonly CraftingRecipe[] = [
    scrollRecipe,
    tomeRecipe,
] as const;
