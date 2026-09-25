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
import { Terrain, terrainDefinitions, type TerrainColors } from "./terrain.ts";

type NonLandTerrain = Exclude<Terrain, typeof Terrain.Land>;

export type PondGeneration = {
    terrain: Terrain;
    chance: number;
    maxCount: number;
    maxSize: number;
};

export type BiomeDefinition = {
    ground: TerrainColors;
    terrainColors: Partial<Record<NonLandTerrain, TerrainColors>>;
    modifier: number;
    generate: boolean;
    trees: readonly NaturalResource[];
    ponds: PondGeneration | null;
};

export const biomes = {
    desert: {
        ground: { color: "#f2d357", tint: "#9c8736" },
        terrainColors: {
            [Terrain.Water]: { color: "#3fb8b0", tint: "#236663" },
        },
        modifier: 5,
        generate: true,
        trees: [cactusResource],
        ponds: { terrain: Terrain.Water, chance: 0.1, maxCount: 1, maxSize: 5 },
    },
    taint: {
        ground: { color: "#590aad", tint: "#3b0c6e" },
        terrainColors: {
            [Terrain.Water]: { color: "#3d1a66", tint: "#221040" },
        },
        modifier: 0,
        generate: false,
        trees: [],
        ponds: null,
    },
    forrest: {
        ground: { color: "#008000", tint: "#084f08" },
        terrainColors: {
            [Terrain.Water]: { color: "#2f6fa3", tint: "#1a3d5c" },
        },
        modifier: 20,
        generate: true,
        trees: [treeResource],
        ponds: { terrain: Terrain.Water, chance: 0.3, maxCount: 1, maxSize: 8 },
    },
    snow: {
        ground: { color: "#e1e8e2", tint: "#b0b3b8" },
        terrainColors: {
            [Terrain.Ice]: { color: "#a9d6e5", tint: "#6f8f9a" },
        },
        modifier: 10,
        generate: true,
        trees: [snowTreeResource],
        ponds: { terrain: Terrain.Ice, chance: 0.25, maxCount: 1, maxSize: 6 },
    },
    mountains: {
        ground: { color: "#5f615f", tint: "#383838" },
        terrainColors: {},
        modifier: 5,
        generate: true,
        trees: [pineResource],
        ponds: {
            terrain: Terrain.Water,
            chance: 0.15,
            maxCount: 1,
            maxSize: 5,
        },
    },
    plains: {
        ground: { color: "#8dd66d", tint: "#5c8a48" },
        terrainColors: {},
        modifier: 2.5,
        generate: true,
        trees: [],
        ponds: null,
    },
    swamp: {
        ground: { color: "#08543d", tint: "#14362c" },
        terrainColors: {
            [Terrain.Water]: { color: "#3b5e4c", tint: "#1c3027" },
        },
        modifier: 10,
        generate: true,
        trees: [swampTreeResource, swampTree2Resource],
        ponds: { terrain: Terrain.Water, chance: 0.8, maxCount: 3, maxSize: 5 },
    },
} satisfies Record<string, BiomeDefinition>;

export type BiomeType = keyof typeof biomes;
export type BiomeEntry = {
    type: BiomeType;
    point: Point;
};

export const TREES_PER_CHUNK = 64;

export function biomeTerrainColors(
    biome: BiomeType,
    terrain: Terrain,
): TerrainColors {
    const definition: BiomeDefinition = biomes[biome];
    if (terrain === Terrain.Land) {
        return definition.ground;
    }
    const override = definition.terrainColors[terrain];
    if (override) {
        return override;
    }
    const defaultColors = terrainDefinitions[terrain].defaultColors;
    if (!defaultColors) {
        throw new Error(
            `Terrain ${terrainDefinitions[terrain].name} has no default colours and ${biome} does not colour it`,
        );
    }
    return defaultColors;
}
