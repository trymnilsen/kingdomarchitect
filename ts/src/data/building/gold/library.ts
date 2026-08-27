import { spriteRefs } from "../../../asset/sprite.ts";
import { SpecialRequirement, type Building } from "../building.ts";
import {
    joineryItem,
    timberFramesItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    goldCoins,
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

/**
 * Where the settlement keeps what it knows. Magic here is clerical work:
 * someone sits and copies, and the building turns them into a scribe rather
 * than a person with a pen.
 *
 * The focus requirement is a low bar. A wizard hat satisfies it, and a wizard
 * hat is ten wood, because by local custom the hat makes the wizard. The gate
 * asks that somebody in the settlement has claimed to be one before a library
 * goes up, not that the claim be expensive.
 */
export const library: Building = {
    id: "library",
    icon: spriteRefs.building_library,
    name: "Library",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 30,
            [stoneResource.id]: 40,
            [goldCoins.id]: 15,
            [timberFramesItem.id]: 12,
            [joineryItem.id]: 20,
        },
        special: [SpecialRequirement.MagicalFocusItem],
    },
};
