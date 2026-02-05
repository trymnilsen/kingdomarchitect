import { sprites2 } from "../../../asset/sprite.ts";
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
    icon: sprites2.building_mill,
    name: "Windmill",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 40,
            [stoneResource.id]: 60,
            [goldCoins.id]: 15,
            [timberFramesItem.id]: 20,
            [gearsItem.id]: 5,
        },
    },
};
