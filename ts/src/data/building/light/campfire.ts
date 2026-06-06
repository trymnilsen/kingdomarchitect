import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { campfireLightSource } from "../../light/lightSourceDefinition.ts";
import {
    woodResourceItem,
    stoneResource,
} from "../../inventory/items/resources.ts";

/**
 * A campfire: a modest gathering light. It deliberately reuses the brazier sprite
 * ({@link spriteRefs.stone_brazier}) — sharing one sprite across buildings is
 * expected, not a conflict. Emission is described by {@link campfireLightSource}.
 */
export const campfire: Building = {
    id: "campfire",
    icon: spriteRefs.stone_brazier,
    name: "Campfire",
    scale: 1,
    previewScale: 2,
    previewOffset: 0,
    light: campfireLightSource.id,
    requirements: {
        materials: {
            [woodResourceItem.id]: 4,
            [stoneResource.id]: 2,
        },
    },
};
