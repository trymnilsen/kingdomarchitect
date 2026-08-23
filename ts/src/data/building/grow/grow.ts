import { spriteRefs } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const farm: Building = {
    id: "farm",
    icon: spriteRefs.farm_4,
    name: "Farm",
    scale: 2,
    /** Crossable, but people would rather not tramp through the crop. */
    traversalWeight: 10,
    requirements: {
        materials: {
            [woodResourceItem.id]: 20,
        },
    },
};

export const tree: Building = {
    id: "tree",
    icon: spriteRefs.tree_1,
    name: "Tree",
    scale: 2,
};

export const growBuildings = [farm, tree];
