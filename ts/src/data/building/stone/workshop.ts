import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

/**
 * The workshop is where a kingdom makes its own tools before it has any
 * industry to make them with: torches, wooden swords, charcoal, bricks. It
 * costs raw materials only, so it can stand before the carpenter does.
 */
export const workshop: Building = {
    id: "workshop",
    icon: spriteRefs.building_workshop,
    name: "Workshop",
    scale: 2,
    requirements: {
        // Tuning placeholder. The cost only needs to be reachable with what a
        // fresh kingdom gathers by hand.
        materials: {
            [woodResourceItem.id]: 20,
            [stoneResource.id]: 10,
        },
    },
};
