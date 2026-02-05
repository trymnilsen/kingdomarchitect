import { sprites2 } from "../../../asset/sprite.ts";
import type { Building } from "../building.ts";
import { woodResourceItem } from "../../inventory/items/resources.ts";

export const farm: Building = {
    id: "farm",
    icon: sprites2.farm_4,
    name: "Farm",
    scale: 2,
    requirements: {
        materials: {
            [woodResourceItem.id]: 20,
        },
    },
};

export const tree: Building = {
    id: "tree",
    icon: sprites2.tree_1,
    name: "Tree",
    scale: 2,
};

export const growBuildings = [farm, tree];
