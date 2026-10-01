import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import {
    gearsItem,
    timberFramesItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    goldCoins,
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const windmill: Building = {
    id: "windmill",
    icon: spriteRefs.building_mill,
    name: "Windmill",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 20,
            [stoneResource.id]: 40,
            [goldCoins.id]: 2,
            [timberFramesItem.id]: 10,
            [gearsItem.id]: 4,
        },
    },
};
