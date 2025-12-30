import { sprites2 } from "../../../asset/sprite.ts";

export const farm = {
    id: "farm",
    icon: sprites2.farm_4,
    name: "Farm",
    scale: 2,
} as const;

export const tree = {
    id: "tree",
    icon: sprites2.tree_1,
    name: "Tree",
    scale: 2,
} as const;

export const growBuildings = [farm, tree];
