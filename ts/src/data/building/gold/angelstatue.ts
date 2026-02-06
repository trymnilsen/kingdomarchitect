import { spriteRefs } from "../../../asset/sprite.ts";
import { SpecialRequirement, type Building } from "../building.ts";
import {
    goldCoins,
    stoneResource,
} from "../../inventory/items/resources.ts";

export const angelStatue: Building = {
    id: "angelstatue",
    icon: spriteRefs.building_statue,
    name: "Angel statue",
    scale: 2,
    requirements: {
        materials: {
            [stoneResource.id]: 50,
            [goldCoins.id]: 20,
        },
        special: [SpecialRequirement.SkilledCarving],
    },
};
