import { spriteRefs } from "../../../asset/sprite.ts";
import { SpecialRequirement, type Building } from "../building.ts";
import {
    stoneResource,
    woodResourceItem,
} from "../../inventory/items/resources.ts";

export const cementary: Building = {
    id: "cementary",
    icon: spriteRefs.building_tombstone,
    name: "Cemetery",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 5,
            [stoneResource.id]: 15,
        },
        special: [SpecialRequirement.DevoteeConsecration],
    },
};
