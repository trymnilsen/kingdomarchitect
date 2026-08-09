import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const goblinCampfire: Building = {
    id: "goblinCampfire",
    icon: spriteRefs.stone_brazier,
    name: "Goblin Campfire",
    scale: 1,
    previewScale: 2,
    previewOffset: 0,
    // Goblin-built structures emit no light for now. Raiders staying invisible
    // in the dark is the point of night raids. The camp's prefab-placed
    // fireplace is the one goblin light in the world.
    light: "none",
    requirements: {
        materials: {
            [woodResourceItem.id]: 10,
        },
    },
};
