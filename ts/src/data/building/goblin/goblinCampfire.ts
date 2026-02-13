import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const goblinCampfire: Building = {
    id: "goblinCampfire",
    icon: spriteRefs.stone_brazier,
    name: "Goblin Campfire",
    scale: 1,
    requirements: {
        materials: {
            [woodResourceItem.id]: 10,
        },
    },
};
