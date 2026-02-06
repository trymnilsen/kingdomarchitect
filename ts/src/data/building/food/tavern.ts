import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import {
    joineryItem,
    stoneBarsItem,
    timberFramesItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    goldCoins,
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const tavern: Building = {
    id: "tavern",
    icon: spriteRefs.building_tavern,
    name: "Tavern",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 30,
            [stoneResource.id]: 20,
            [goldCoins.id]: 10,
            [timberFramesItem.id]: 15,
            [joineryItem.id]: 10,
            [stoneBarsItem.id]: 3,
        },
    },
};
