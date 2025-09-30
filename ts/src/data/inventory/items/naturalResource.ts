import { sprites2 } from "../../../asset/sprite.js";

export const treeResource = {
    asset: sprites2.tree_1,
    id: "tree1",
    name: "Tree",
} as const;

export const pineResource = {
    asset: sprites2.pine_tree,
    id: "pineTree",
    name: "Pine Tree",
} as const;

export const snowTreeResource = {
    asset: sprites2.pine_tree_winter,
    id: "pineTreeSnow",
    name: "Pine Tree",
} as const;

export const swampTreeResource = {
    asset: sprites2.swamp_tree5,
    id: "pineTreeSnow",
    name: "Pine Tree",
} as const;

export const swampTree2Resource = {
    asset: sprites2.swamp_tree7,
    id: "swampTree2",
    name: "Swamp tree",
} as const;

export const swampFlowerResource = {
    asset: sprites2.swamp_flower,
    id: "swampFlower",
    name: "Swamp Flower",
} as const;

export const grassResource = {
    asset: sprites2.nature_grass_leaves,
    id: "grass",
    name: "Grass leaves",
} as const;

export const cactusResource = {
    asset: sprites2.desertCactus,
    id: "cactus1",
    name: "Cactus",
} as const;

export const cactusFlowerResource = {
    asset: sprites2.desertCactusFlower2,
    id: "cactusFlower",
    name: "Cactus Flower",
} as const;

export const mushroomResource = {
    asset: sprites2.nature_mushroom2,
    id: "mushroom2",
    name: "Mushroom",
} as const;

export const berryBushResource = {
    asset: sprites2.nature_berrybush,
    id: "berrybush",
    name: "Berry Bush",
} as const;

export const flowerResource = {
    asset: sprites2.plainsFlower,
    id: "plainsFlower",
    name: "Flower",
} as const;

export const snowFlowerResource = {
    asset: sprites2.snowFlower,
    id: "snowFlower",
    name: "Flower",
} as const;

export const stoneResource = {
    asset: sprites2.stone,
    id: "stone1",
    name: "Stone",
} as const;

export type NaturalResource =
    | typeof swampTreeResource
    | typeof swampTree2Resource
    | typeof swampFlowerResource
    | typeof snowFlowerResource
    | typeof snowTreeResource
    | typeof flowerResource
    | typeof cactusFlowerResource
    | typeof berryBushResource
    | typeof mushroomResource
    | typeof grassResource
    | typeof treeResource
    | typeof pineResource
    | typeof stoneResource
    | typeof cactusResource;
