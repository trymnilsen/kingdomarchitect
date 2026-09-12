import { type Point } from "../../common/point.ts";
import {
    cactusResource,
    pineResource,
    snowTreeResource,
    swampTree2Resource,
    swampTreeResource,
    treeResource,
    type NaturalResource,
} from "../../data/inventory/items/naturalResource.ts";

export type BiomeDefinition = {
    color: string;
    tint: string;
    modifier: number;
    generate: boolean;
    trees: readonly NaturalResource[];
};

export const biomes = {
    desert: {
        color: "#f2d357",
        tint: "#9c8736",
        modifier: 5,
        generate: true,
        trees: [cactusResource],
    },
    taint: {
        color: "#590aad",
        tint: "#3b0c6e",
        modifier: 0,
        generate: false,
        trees: [],
    },
    forrest: {
        color: "#008000",
        tint: "#084f08",
        modifier: 20,
        generate: true,
        trees: [treeResource],
    },
    snow: {
        color: "#e1e8e2",
        tint: "#b0b3b8",
        modifier: 10,
        generate: true,
        trees: [snowTreeResource],
    },
    mountains: {
        color: "#5f615f",
        tint: "#383838",
        modifier: 5,
        generate: true,
        trees: [pineResource],
    },
    plains: {
        color: "#8dd66d",
        tint: "#5c8a48",
        modifier: 2.5,
        generate: true,
        trees: [],
    },
    swamp: {
        color: "#08543d",
        tint: "#14362c",
        modifier: 10,
        generate: true,
        trees: [swampTreeResource, swampTree2Resource],
    },
} satisfies Record<string, BiomeDefinition>;

export type BiomeType = keyof typeof biomes;
export type BiomeEntry = {
    type: BiomeType;
    point: Point;
};

export const TREES_PER_CHUNK = 16;
