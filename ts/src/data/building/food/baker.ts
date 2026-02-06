import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import {
    clayBricksItem,
    timberFramesItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const baker: Building = {
    id: "baker",
    icon: spriteRefs.building_baker,
    name: "Baker",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 20,
            [stoneResource.id]: 15,
            [timberFramesItem.id]: 5,
            [clayBricksItem.id]: 10,
        },
    },
};
