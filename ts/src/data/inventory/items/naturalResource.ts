import { sprites2 } from "../../../module/asset/sprite.js";

export const treeResource = {
    asset: sprites2.tree_1,
    id: "tree1",
    name: "Tree",
} as const;

export const stoneResource = {
    asset: sprites2.tree_1,
    id: "tree1",
    name: "Tree",
} as const;

export type NaturalResource = typeof treeResource | typeof stoneResource;
