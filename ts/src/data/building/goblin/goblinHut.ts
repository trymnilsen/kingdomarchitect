import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const goblinHut: Building = {
    id: "goblinHut",
    icon: spriteRefs.goblin_house,
    name: "Goblin Hut",
    scale: 2,
    previewScale: 4,
    previewOffset: 0,
    // Goblin-built structures emit no light for now. Raiders staying invisible
    // in the dark is the point of night raids.
    light: "none",
    requirements: {
        materials: {
            [woodResourceItem.id]: 15,
        },
    },
};
