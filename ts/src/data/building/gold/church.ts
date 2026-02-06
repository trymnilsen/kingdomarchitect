import { spriteRefs } from "../../../asset/sprite.ts";
import { SpecialRequirement, type Building } from "../building.ts";
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

export const church: Building = {
    id: "church",
    icon: spriteRefs.building_chapel,
    name: "Church",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 30,
            [stoneResource.id]: 100,
            [goldCoins.id]: 25,
            [timberFramesItem.id]: 20,
            [joineryItem.id]: 15,
            [stoneBarsItem.id]: 5,
        },
        special: [SpecialRequirement.DevoteeLabor],
    },
};
