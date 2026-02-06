import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const carpenter: Building = {
    id: "carpenter",
    icon: spriteRefs.carpenter,
    name: "Carpenter",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 50,
        },
    },
};
