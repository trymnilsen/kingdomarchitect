import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import {
    joineryItem,
    planksItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    stoneResource,
    strawResourceItem,
} from "../../inventory/items/resources.ts";

export const fishingHut: Building = {
    id: "fishinghut",
    icon: spriteRefs.building_fishing_hut_left,
    name: "Fishing Hut",
    scale: 2,
    requirements: {
        materials: {
            [planksItem.id]: 20,
            [stoneResource.id]: 20,
            [joineryItem.id]: 5,
            [strawResourceItem.id]: 5,
        },
    },
};
