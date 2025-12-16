import { sprites2, type Sprite2 } from "../../../asset/sprite.js";

export enum ResourceCategory {
    Chop,
    Mine,
    Cut,
    Pick,
}

type Resource = {
    asset: Sprite2;
    id: string;
    name: string;
    category: ResourceCategory | ResourceCategory[];
    regrow?: boolean;
    regrowSprite?: Sprite2;
};

export const treeResource = {
    asset: sprites2.tree_1,
    id: "tree1",
    name: "Tree",
    category: ResourceCategory.Chop,
};

export const pineResource = {
    asset: sprites2.pine_tree,
    id: "pineTree",
    name: "Pine Tree",
    category: ResourceCategory.Chop,
};

export const snowTreeResource = {
    asset: sprites2.pine_tree_winter,
    id: "pineTreeSnow",
    name: "Pine Tree",
    category: ResourceCategory.Chop,
};

export const swampTreeResource = {
    asset: sprites2.swamp_tree5,
    id: "pineTreeSnow",
    name: "Pine Tree",
    category: ResourceCategory.Chop,
};

export const swampTree2Resource = {
    asset: sprites2.swamp_tree7,
    id: "swampTree2",
    name: "Swamp tree",
    category: ResourceCategory.Chop,
};

export const swampFlowerResource = {
    asset: sprites2.swamp_flower_duo,
    id: "swampFlower",
    name: "Swamp Flower",
    category: ResourceCategory.Pick,
};

export const grassResource = {
    asset: sprites2.nature_grass_leaves,
    id: "grass",
    name: "Grass leaves",
    category: ResourceCategory.Cut,
};

export const cactusResource = {
    asset: sprites2.desertCactus,
    id: "cactus1",
    name: "Cactus",
    category: ResourceCategory.Chop,
};

export const cactusFlowerResource = {
    asset: sprites2.desertCactusFlower2,
    id: "cactusFlower",
    name: "Cactus Flower",
    category: ResourceCategory.Pick,
};

export const mushroomResource = {
    asset: sprites2.nature_mushroom2,
    id: "mushroom2",
    name: "Mushroom",
    category: ResourceCategory.Pick,
};

export const berryBushResource = {
    asset: sprites2.nature_berrybush,
    id: "berrybush",
    name: "Berry Bush",
    category: [ResourceCategory.Pick, ResourceCategory.Cut],
    regrow: true,
};

export const flowerResource = {
    asset: sprites2.plainsFlower,
    id: "plainsFlower",
    name: "Flower",
    category: ResourceCategory.Pick,
};

export const snowFlowerResource = {
    asset: sprites2.snowFlower,
    id: "snowFlower",
    name: "Flower",
    category: ResourceCategory.Pick,
};

export const stoneResource = {
    asset: sprites2.stone,
    id: "stone1",
    name: "Stone",
    category: ResourceCategory.Mine,
};

export const NaturalResources = [
    swampTreeResource,
    swampTree2Resource,
    swampFlowerResource,
    snowFlowerResource,
    snowTreeResource,
    flowerResource,
    cactusFlowerResource,
    berryBushResource,
    mushroomResource,
    grassResource,
    treeResource,
    pineResource,
    stoneResource,
    cactusResource,
] as const satisfies Resource[];

export type NaturalResource = (typeof NaturalResources)[number];
