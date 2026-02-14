import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const goblinHut: Building = {
    id: "goblinHut",
    icon: spriteRefs.goblin_house,
    name: "Goblin Hut",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 15,
        },
    },
};
