import { BiomeEntry } from "../biome.js";
import { BiomeMap } from "../biomeMap.js";
import { BiomeMapCollection } from "../biomeMapCollection.js";
import { generateConnectionPoints } from "../common/connectionPoints.js";
import { generateForts } from "../common/forts.js";
import { generateRandomTrees } from "../common/vegetation.js";
import {
    generateTaintedDeadTrees,
    generateTaintedTrees,
} from "./tainVegetation.js";
import { generateTaintCrystals } from "./taintCrystals.js";
import { generateTaintPortals } from "./taintPortal.js";

export function createTaintBiome(
    biome: BiomeEntry,
    biomes: BiomeMapCollection,
) {
    const biomeMap = new BiomeMap(biome.point, biome.type);
    generateTaintPortals();
    generateTaintedTrees();
    generateTaintedDeadTrees();
    generateForts(biomeMap);
    generateConnectionPoints(biomeMap, biomes);
    generateTaintCrystals();
    generateRandomTrees(biomeMap, 32, 64);
    return biomeMap;
}
