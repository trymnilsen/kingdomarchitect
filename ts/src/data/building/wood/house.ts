import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const woodenHouse: Building = {
    id: "woodenhouse",
    icon: spriteRefs.wooden_house,
    name: "Wooden House",
    scale: 4,
    requirements: {
        materials: {
            [woodResourceItem.id]: 20,
        },
    },
};
