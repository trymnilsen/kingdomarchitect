import { sprites2 } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import {
    stoneBarsItem,
    timberFramesItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const stoneTower: Building = {
    id: "stonetower",
    icon: sprites2.building_tower,
    name: "Stone tower",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 15,
            [stoneResource.id]: 40,
            [timberFramesItem.id]: 8,
            [stoneBarsItem.id]: 3,
        },
    },
};
