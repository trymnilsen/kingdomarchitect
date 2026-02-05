import { sprites2 } from "../../../asset/sprite.ts";
import { SpecialRequirement, type Building } from "../building.ts";
import {
    ironBarsItem,
    joineryItem,
} from "../../inventory/items/processedMaterials.ts";
import {
    goldCoins,
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const enchanter: Building = {
    id: "enchanter",
    icon: sprites2.building_enchanter,
    name: "Enchanter",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 20,
            [stoneResource.id]: 40,
            [goldCoins.id]: 30,
            [joineryItem.id]: 10,
            [ironBarsItem.id]: 3,
        },
        special: [SpecialRequirement.MagicalFocusItem],
    },
};
